
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace TareXSyncAgent;

public sealed class WeighmentUploadService
{
    private readonly HttpClient _httpClient;
    private readonly DesktopAuthService _authService;
    private readonly IConfiguration _configuration;

    public WeighmentUploadService(
        HttpClient httpClient,
        DesktopAuthService authService,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _authService = authService;
        _configuration = configuration;
    }

    public async Task<HttpStatusCode> UploadAsync(
        string payloadJson,
        long revision,
        CancellationToken token)
    {
        string baseUrl =
            _configuration["TareX:ApiBaseUrl"]
            ?? throw new InvalidOperationException(
                "API base URL is missing.");

        string accessToken =
            await _authService.GetAccessTokenAsync(token);

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            baseUrl.TrimEnd('/') + "/api/sync/weighments");

        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer", accessToken);

        using var document = JsonDocument.Parse(payloadJson);

        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();

            foreach (var property in
                     document.RootElement.EnumerateObject())
            {
                property.WriteTo(writer);
            }

            writer.WriteNumber("sourceRevision", revision);
            writer.WriteEndObject();
        }

        request.Content = new StringContent(
            Encoding.UTF8.GetString(stream.ToArray()),
            Encoding.UTF8,
            "application/json");

        using var response =
            await _httpClient.SendAsync(request, token);

        return response.StatusCode;
    }

    public async Task<JsonDocument?> GetCloudWeighmentAsync(
        int sourceTransactionId,
        CancellationToken token)
    {
        string baseUrl =
            _configuration["TareX:ApiBaseUrl"]
            ?? throw new InvalidOperationException(
                "API base URL is missing.");

        string accessToken =
            await _authService.GetAccessTokenAsync(token);

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            baseUrl.TrimEnd('/') +
            $"/api/sync/weighments/{sourceTransactionId}");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        using var response =
            await _httpClient.SendAsync(request, token);

        if (response.StatusCode == HttpStatusCode.NotFound)
            return null;

        response.EnsureSuccessStatusCode();

        string json =
            await response.Content.ReadAsStringAsync(token);

        return JsonDocument.Parse(json);
    }
}
