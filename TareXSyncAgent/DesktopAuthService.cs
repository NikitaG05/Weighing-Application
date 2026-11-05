
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace TareXSyncAgent;

public sealed class DesktopAuthService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    private string? _accessToken;
    private DateTimeOffset _expiresAt =
        DateTimeOffset.MinValue;

    public DesktopAuthService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> GetAccessTokenAsync(
        CancellationToken cancellationToken = default)
    {
        // Reuse token while it remains valid.
        if (!string.IsNullOrWhiteSpace(_accessToken)
            && DateTimeOffset.UtcNow < _expiresAt)
        {
            return _accessToken;
        }

        string apiBaseUrl =
            _configuration["TareX:ApiBaseUrl"]
            ?? throw new InvalidOperationException(
                "API base URL is missing.");

        string clientCode =
            _configuration["TareX:ClientCode"]
            ?? throw new InvalidOperationException(
                "Desktop client code is missing.");

        string clientSecret =
            Environment.GetEnvironmentVariable(
                "TAREX_SYNC_CLIENT_SECRET")
            ?? throw new InvalidOperationException(
                "TAREX_SYNC_CLIENT_SECRET is not configured.");

        string url = apiBaseUrl.TrimEnd('/')
            + "/api/sync/auth/login";

        using var response = await _httpClient.PostAsJsonAsync(
            url,
            new
            {
                clientCode,
                clientSecret
            },
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var result = await response.Content
            .ReadFromJsonAsync<DesktopLoginResponse>(
                cancellationToken: cancellationToken);

        if (result == null ||
            string.IsNullOrWhiteSpace(result.AccessToken) ||
            result.ExpiresIn <= 0)
        {
            throw new InvalidOperationException(
                "Invalid desktop authentication response.");
        }

        long configuredSiteId =
            _configuration.GetValue<long>("TareX:SiteId");

        if (configuredSiteId <= 0 ||
            result.SiteId != configuredSiteId)
        {
            throw new InvalidOperationException(
                "Authenticated desktop site does not match configured SiteId.");
        }

        // Refresh 60 seconds before expiry.
        long validSeconds = Math.Max(
            1, result.ExpiresIn - 60);

        _accessToken = result.AccessToken;
        _expiresAt = DateTimeOffset.UtcNow
            .AddSeconds(validSeconds);

        return _accessToken;
    }

    private sealed class DesktopLoginResponse
    {
        [JsonPropertyName("accessToken")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("siteId")]
        public long SiteId { get; set; }

        [JsonPropertyName("expiresIn")]
        public long ExpiresIn { get; set; }
    }
}
