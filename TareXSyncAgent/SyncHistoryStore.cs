
using Microsoft.Data.Sqlite;

namespace TareXSyncAgent;

public sealed class SyncHistoryStore
{
    private readonly string _connectionString;

    public SyncHistoryStore()
    {
        string folder = Path.Combine(
            Environment.GetFolderPath(
                Environment.SpecialFolder.CommonApplicationData),
            "TareX",
            "LocalTest");

        Directory.CreateDirectory(folder);

        string databasePath = Path.Combine(
            folder, "sync-history.db");

        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = databasePath
        }.ToString();
    }

    public async Task InitializeAsync()
    {
        await using var connection =
            new SqliteConnection(_connectionString);

        await connection.OpenAsync();

        await using var command = connection.CreateCommand();

        command.CommandText = """
            CREATE TABLE IF NOT EXISTS SyncHistory (
                SiteId INTEGER NOT NULL,
                TransactionId INTEGER NOT NULL,
                SourceRevision INTEGER NOT NULL,
                PayloadHash TEXT NOT NULL,
                SyncedAt TEXT NOT NULL,
                PRIMARY KEY (SiteId, TransactionId)
            );
            """;

        await command.ExecuteNonQueryAsync();
    }

    public async Task<(long Revision, string Hash)?> GetAsync(
        long siteId, int transactionId)
    {
        await using var connection =
            new SqliteConnection(_connectionString);

        await connection.OpenAsync();

        await using var command = connection.CreateCommand();

        command.CommandText = """
            SELECT SourceRevision, PayloadHash
            FROM SyncHistory
            WHERE SiteId = $siteId
              AND TransactionId = $transactionId;
            """;

        command.Parameters.AddWithValue("$siteId", siteId);
        command.Parameters.AddWithValue("$transactionId", transactionId);

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        return (reader.GetInt64(0), reader.GetString(1));
    }

    public async Task MarkSyncedAsync(
        long siteId,
        int transactionId,
        long revision,
        string payloadHash)
    {
        await using var connection =
            new SqliteConnection(_connectionString);

        await connection.OpenAsync();

        await using var command = connection.CreateCommand();

        command.CommandText = """
            INSERT INTO SyncHistory
                (SiteId, TransactionId,
                 SourceRevision, PayloadHash, SyncedAt)
            VALUES
                ($siteId, $transactionId,
                 $revision, $hash, $syncedAt)
            ON CONFLICT(SiteId, TransactionId)
            DO UPDATE SET
                SourceRevision = excluded.SourceRevision,
                PayloadHash = excluded.PayloadHash,
                SyncedAt = excluded.SyncedAt;
            """;

        command.Parameters.AddWithValue("$siteId", siteId);
        command.Parameters.AddWithValue("$transactionId", transactionId);
        command.Parameters.AddWithValue("$revision", revision);
        command.Parameters.AddWithValue("$hash", payloadHash);
        command.Parameters.AddWithValue(
            "$syncedAt", DateTimeOffset.UtcNow.ToString("O"));

        await command.ExecuteNonQueryAsync();
    }
}
