
using TareXSyncAgent;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "TareX Sync Agent";
});

builder.Services.AddSingleton<SyncHistoryStore>();

builder.Services.AddHttpClient<DesktopAuthService>();

builder.Services.AddHttpClient<WeighmentUploadService>()
    .ConfigureHttpClient(client =>
    {
        client.Timeout = TimeSpan.FromSeconds(60);
    });

builder.Services.AddHostedService<Worker>();

var host = builder.Build();

var syncHistory = host.Services
    .GetRequiredService<SyncHistoryStore>();

await syncHistory.InitializeAsync();

// Temporary authentication test
var authService = host.Services
    .GetRequiredService<DesktopAuthService>();

try
{
    await authService.GetAccessTokenAsync();
    Console.WriteLine("SUCCESS: Desktop authentication completed.");
}
catch (Exception ex)
{
    Console.WriteLine($"AUTH FAILED: {ex.Message}");
    return;
}

await host.RunAsync();
