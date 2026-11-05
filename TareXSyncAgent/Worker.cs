
using Microsoft.Data.SqlClient;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TareXSyncAgent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IConfiguration _configuration;
    private readonly SyncHistoryStore _syncHistory;
    private readonly WeighmentUploadService _uploadService;

    private const int BatchSize = 5;

    public Worker(
        ILogger<Worker> logger,
        IConfiguration configuration,
        SyncHistoryStore syncHistory,
        WeighmentUploadService uploadService)
    {
        _logger = logger;
        _configuration = configuration;
        _syncHistory = syncHistory;
        _uploadService = uploadService;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        string connectionString =
            _configuration["TareX:SqlServerConnection"]
            ?? throw new InvalidOperationException(
                "SQL Server connection is missing.");

        long siteId = _configuration.GetValue<long>(
            "TareX:SiteId", 1);

        int interval = Math.Max(
            10,
            _configuration.GetValue<int>(
                "TareX:SyncIntervalSeconds", 60));

        _logger.LogInformation(
            "Automatic synchronization started. " +
            "SiteId={SiteId}, Interval={Interval}s, BatchSize={BatchSize}",
            siteId, interval, BatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncWeighmentsAsync(
                    connectionString,
                    siteId,
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error during weighment synchronization.");
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(interval),
                    stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task SyncWeighmentsAsync(
        string connectionString,
        long siteId,
        CancellationToken token)
    {
        // Read a consistent snapshot from SQL Server.
        // Do not keep the SQL reader open during HTTP uploads.
        var records = new List<WeighmentRecord>();

        await using (var connection =
            new SqlConnection(connectionString))
        {
            await connection.OpenAsync(token);

            const string query = """
                SELECT
                    w.TransactionId,
                    w.TicketNo,
                    COALESCE(
                        NULLIF(w.PartyNameManual, ''),
                        p.PartyName, ''
                    ) AS PartyName,
                    COALESCE(
                        NULLIF(w.VehicleNoManual, ''),
                        v.VehicleNumber, ''
                    ) AS VehicleNo,
                    COALESCE(
                        NULLIF(w.ProductNameManual, ''),
                        pr.ProductName, ''
                    ) AS ProductName,
                    w.GrossWeight,
                    w.TareWeight,
                    w.NetWeight,
                    w.TicketDate,
                    w.GrossDate,
                    w.TareDate,
                    w.Status
                FROM dbo.WeighmentTransaction w
                LEFT JOIN dbo.Party p
                    ON w.PartyId = p.PartyId
                LEFT JOIN dbo.Vehicle v
                    ON w.VehicleId = v.VehicleId
                LEFT JOIN dbo.Product pr
                    ON w.ProductId = pr.ProductId
                WHERE w.IsDeleted = 0
                    AND w.Status = 'COMPLETED'
                    ORDER BY w.TransactionId ASC;
                """;

            await using var command =
                new SqlCommand(query, connection);

            await using var reader =
                await command.ExecuteReaderAsync(token);

            while (await reader.ReadAsync(token))
            {
                records.Add(new WeighmentRecord(
                    Id: reader.GetInt32(0),
                    Ticket: GetString(reader, 1),
                    Party: GetString(reader, 2),
                    Vehicle: GetString(reader, 3),
                    Product: GetString(reader, 4),
                    Gross: GetDecimal(reader, 5),
                    Tare: GetDecimal(reader, 6),
                    Net: GetDecimal(reader, 7),
                    TicketDate: GetDate(reader, 8),
                    GrossDate: GetDate(reader, 9),
                    TareDate: GetDate(reader, 10),
                    Status: GetString(reader, 11)
                ));
            }
        }

        int uploaded = 0;
        int skipped = 0;
        int failed = 0;

        foreach (var record in records)
        {
            token.ThrowIfCancellationRequested();

            if (uploaded >= BatchSize)
                break;

            var payload = new
            {
                sourceTransactionId = record.Id,
                siteId,
                ticketNo = record.Ticket,
                vehicleNo = record.Vehicle,
                partyName = record.Party,
                productName = record.Product,
                grossWeight = record.Gross,
                tareWeight = record.Tare,
                netWeight = record.Net,
                ticketDate = record.TicketDate,
                grossDate = record.GrossDate,
                tareDate = record.TareDate,
                status = record.Status,
                completed = true,
                deleted = false
            };

            string json = JsonSerializer.Serialize(payload);

            string hash = Convert.ToHexString(
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(json)));

            var history = await _syncHistory.GetAsync(
                siteId, record.Id);

            if (history.HasValue &&
                history.Value.Hash == hash)
            {
                skipped++;
                continue;
            }

            long revision = history.HasValue
                ? checked(history.Value.Revision + 1)
                : 1;

            _logger.LogInformation(
                "UPLOADING | ID={Id} | Ticket={Ticket} | Revision={Revision}",
                record.Id,
                record.Ticket,
                revision);

            HttpStatusCode? statusCode = null;
            bool uncertainOutcome = false;

            try
            {
                statusCode = await _uploadService.UploadAsync(
                    json, revision, token);
            }
            catch (OperationCanceledException)
                when (token.IsCancellationRequested)
            {
                throw;
            }
            catch (HttpRequestException ex)
            {
                uncertainOutcome = true;
                _logger.LogWarning(ex,
                    "UPLOAD NETWORK ERROR | ID={Id}", record.Id);
            }
            catch (OperationCanceledException ex)
                when (!token.IsCancellationRequested)
            {
                uncertainOutcome = true;

                _logger.LogWarning(
                    ex,
                    "UPLOAD TIMEOUT / CANCELLED REQUEST | ID={Id}",
                    record.Id);
            }
            catch (Exception ex)
            {
                failed++;
                _logger.LogError(ex,
                    "UPLOAD ERROR | ID={Id}. Record not marked synced.",
                    record.Id);
                break;
            }

            if (statusCode == HttpStatusCode.OK)
            {
                await _syncHistory.MarkSyncedAsync(
                    siteId, record.Id, revision, hash);

                uploaded++;
                _logger.LogInformation(
                    "SYNC SUCCESS | ID={Id} | Revision={Revision}",
                    record.Id, revision);
            }
            else if (statusCode == HttpStatusCode.Conflict ||
                     uncertainOutcome)
            {
                try
                {
                    using var cloud =
                        await _uploadService.GetCloudWeighmentAsync(
                            record.Id, token);
                    using var local = JsonDocument.Parse(json);

                    if (cloud != null &&
                        CloudMatchesLocal(
                            cloud.RootElement,
                            local.RootElement,
                            revision))
                    {
                        await _syncHistory.MarkSyncedAsync(
                            siteId, record.Id, revision, hash);

                        uploaded++;
                        _logger.LogInformation(
                            "SYNC RECONCILED | ID={Id} | Revision={Revision}",
                            record.Id, revision);
                    }
                    else
                    {
                        failed++;
                        _logger.LogWarning(
                            "SYNC CONFLICT / UNCONFIRMED | ID={Id} | " +
                            "Expected revision={Revision}. " +
                            "Cloud record absent or different; no overwrite attempted.",
                            record.Id, revision);
                        break;
                    }
                }
                catch (OperationCanceledException)
                    when (token.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    failed++;
                    _logger.LogError(ex,
                        "SYNC RECONCILIATION FAILED | ID={Id}. " +
                        "Record not marked synced.", record.Id);
                    break;
                }
            }
            else
            {
                failed++;
                _logger.LogWarning(
                    "SYNC FAILED | ID={Id} | HTTP {Status}",
                    record.Id, (int?)statusCode);
                break;
            }
        }

        _logger.LogInformation(
            "SYNC CYCLE FINISHED | Uploaded={Uploaded} | " +
            "Skipped={Skipped} | Failed={Failed}",
            uploaded,
            skipped,
            failed);
    }

    private static bool CloudMatchesLocal(
        JsonElement cloud,
        JsonElement local,
        long revision)
    {
        if (!cloud.TryGetProperty("sourceRevision", out var rev) ||
            rev.ValueKind != JsonValueKind.Number ||
            rev.GetInt64() != revision)
            return false;

        string[] fields =
        {
            "sourceTransactionId", "siteId", "ticketNo",
            "vehicleNo", "partyName", "productName",
            "grossWeight", "tareWeight", "netWeight",
            "ticketDate", "grossDate", "tareDate",
            "status", "completed", "deleted"
        };

        foreach (string field in fields)
        {
            if (!cloud.TryGetProperty(field, out var cloudValue) ||
                !local.TryGetProperty(field, out var localValue))
                return false;

            if (cloudValue.ValueKind == JsonValueKind.Number &&
                localValue.ValueKind == JsonValueKind.Number)
            {
                if (cloudValue.GetDecimal() != localValue.GetDecimal())
                    return false;
            }
            else if (cloudValue.ValueKind == JsonValueKind.Null &&
                     localValue.ValueKind == JsonValueKind.Null)
            {
                continue;
            }
            else if (cloudValue.ValueKind != localValue.ValueKind ||
                     cloudValue.ToString() != localValue.ToString())
            {
                return false;
            }
        }

        return true;
    }

    private static string GetString(
        SqlDataReader reader,
        int index)
    {
        return reader.IsDBNull(index)
            ? ""
            : reader.GetString(index);
    }

    private static decimal GetDecimal(
        SqlDataReader reader,
        int index)
    {
        return reader.IsDBNull(index)
            ? 0m
            : reader.GetDecimal(index);
    }

    private static string? GetDate(
        SqlDataReader reader,
        int index)
    {
        return reader.IsDBNull(index)
            ? null
            : reader.GetDateTime(index)
                .ToString("yyyy-MM-dd HH:mm:ss");
    }

    private sealed record WeighmentRecord(
        int Id,
        string Ticket,
        string Party,
        string Vehicle,
        string Product,
        decimal Gross,
        decimal Tare,
        decimal Net,
        string? TicketDate,
        string? GrossDate,
        string? TareDate,
        string Status
    );
}
