using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Nocturne.API.Controllers.V4.PlatformAdmin;
using Nocturne.API.Services;
using Nocturne.API.Services.Health.GoogleHealth;
using Nocturne.Connectors.GoogleHealth.Configurations;
using Nocturne.Core.Contracts.Auth;
using Nocturne.Infrastructure.Shared.Services;
using Nocturne.Tests.Shared.Infrastructure;

namespace Nocturne.API.Tests.Health.GoogleHealth;

public sealed class GoogleHealthAdminSettingsTests
{
    private const string Callback = "https://family.example/api/v4/google-health/oauth/callback";
    private static IConfigurationRoot Configuration(bool configured = true) => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["INSTANCE_KEY"] = "synthetic-test-instance-key-with-at-least-32-characters",
            [GoogleHealthPlatformOptions.ClientIdKey] = configured ? "deployment.apps.googleusercontent.com" : "",
            [GoogleHealthPlatformOptions.ClientSecretKey] = configured ? "deployment-secret" : "",
            [GoogleHealthPlatformOptions.RedirectUriKey] = configured ? Callback : "",
        }).Build();

    private static ISecretEncryptionService Encryption(IConfiguration configuration) =>
        new SecretEncryptionService(configuration, NullLogger<SecretEncryptionService>.Instance);

    private static GoogleHealthPlatformOptions Defaults(IConfiguration configuration) => new()
    {
        ClientId = configuration[GoogleHealthPlatformOptions.ClientIdKey] ?? "",
        ClientSecret = configuration[GoogleHealthPlatformOptions.ClientSecretKey] ?? "",
        RedirectUri = configuration[GoogleHealthPlatformOptions.RedirectUriKey] ?? "",
    };

    [Fact]
    public async Task Overrides_survive_a_new_provider_and_secrets_are_never_in_the_admin_response_or_bot_bootstrap()
    {
        using var database = TestDbContextFactory.CreateSqlite();
        var config = Configuration();
        var encryption = Encryption(config);
        var defaults = Defaults(config);
        var settings = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), encryption, Options.Create(defaults), config);
        var result = await settings.SaveAsync(new()
        {
            OverrideEnabled = true, ClientId = "admin.apps.googleusercontent.com", ClientSecret = "admin-only-secret",
        }, default);
        Assert.Empty(result.Errors);
        Assert.Equal("deployment", result.Settings!.RedirectUri.Source);
        Assert.True(result.Settings.ClientSecret.ValuesDiffer);
        var response = JsonSerializer.Serialize(result);
        Assert.DoesNotContain("admin-only-secret", response);
        Assert.DoesNotContain("deployment-secret", response);
        await using (var db = database.CreateContext())
        {
            var row = Assert.Single(db.PlatformSettings);
            Assert.DoesNotContain("admin-only-secret", row.EncryptedJson);
            Assert.DoesNotContain("admin.apps.googleusercontent.com", row.EncryptedJson);
        }
        var restarted = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), encryption, Options.Create(defaults), config);
        var effective = await restarted.GetAsync();
        Assert.Equal("admin.apps.googleusercontent.com", effective.ClientId);
        Assert.Equal("admin-only-secret", effective.ClientSecret);
        Assert.Equal(Callback, effective.RedirectUri);
        Assert.Equal("deployment-secret", defaults.ClientSecret);
        Assert.Equal("deployment-secret", config[GoogleHealthPlatformOptions.ClientSecretKey]);
        var bots = new PlatformSettingsService(database.ContextFactory.AsNocturneFactory(), encryption);
        Assert.DoesNotContain(await bots.GetAllDecryptedAsync(), row => row.Category == GoogleHealthAdminSettings.Category);
    }

    [Fact]
    public async Task Empty_values_preserve_the_secret_and_explicit_clear_restores_deployment_fallback()
    {
        using var database = TestDbContextFactory.CreateSqlite();
        var config = Configuration();
        var settings = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Encryption(config), Options.Create(Defaults(config)), config);
        await settings.SaveAsync(new() { OverrideEnabled = true, ClientSecret = "stored-admin-secret" }, default);
        await settings.SaveAsync(new() { OverrideEnabled = true, ClientSecret = "" }, default);
        Assert.Equal("stored-admin-secret", (await settings.GetAsync()).ClientSecret);
        await settings.SaveAsync(new() { OverrideEnabled = true, UseDeploymentFields = ["clientSecret"] }, default);
        Assert.Equal("deployment-secret", (await settings.GetAsync()).ClientSecret);
        Assert.False((await settings.StatusAsync()).ClientSecret.AdminConfigured);
    }

    [Fact]
    public async Task Disabling_keeps_saved_values_while_removal_restores_the_original_environment_configuration()
    {
        using var database = TestDbContextFactory.CreateSqlite();
        var config = Configuration();
        var settings = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Encryption(config), Options.Create(Defaults(config)), config);
        await settings.SaveAsync(new() { OverrideEnabled = true, ClientSecret = "stored-admin-secret" }, default);
        await settings.SaveAsync(new() { OverrideEnabled = false }, default);
        Assert.Equal("deployment-secret", (await settings.GetAsync()).ClientSecret);
        Assert.True((await settings.StatusAsync()).ClientSecret.AdminConfigured);
        await settings.SaveAsync(new() { OverrideEnabled = true }, default);
        Assert.Equal("stored-admin-secret", (await settings.GetAsync()).ClientSecret);
        await settings.RemoveAsync(default);
        Assert.Equal("deployment-secret", (await settings.GetAsync()).ClientSecret);
        Assert.False((await settings.StatusAsync()).AdminSettingsStored);
    }

    [Fact]
    public async Task A_second_provider_observes_changes_without_a_restart_or_process_environment_mutation()
    {
        using var database = TestDbContextFactory.CreateSqlite();
        var config = Configuration();
        var environmentBefore = Environment.GetEnvironmentVariable(GoogleHealthPlatformOptions.ClientSecretKey);
        var first = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Encryption(config), Options.Create(Defaults(config)), config);
        var second = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Encryption(config), Options.Create(Defaults(config)), config);
        Assert.Equal("deployment-secret", (await second.GetAsync()).ClientSecret);
        await first.SaveAsync(new() { OverrideEnabled = true, ClientSecret = "new-admin-secret" }, default);
        Assert.Equal("new-admin-secret", (await second.GetAsync()).ClientSecret);
        Assert.Equal(environmentBefore, Environment.GetEnvironmentVariable(GoogleHealthPlatformOptions.ClientSecretKey));
    }

    [Fact]
    public async Task An_installation_without_env_can_be_configured_entirely_in_admin()
    {
        using var database = TestDbContextFactory.CreateSqlite();
        var config = Configuration(configured: false);
        var settings = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Encryption(config), Options.Create(Defaults(config)), config);
        Assert.False((await settings.GetAsync()).IsConfigured);
        var result = await settings.SaveAsync(new()
        {
            OverrideEnabled = true, ClientId = "admin.apps.googleusercontent.com", ClientSecret = "synthetic-admin-secret", RedirectUri = Callback,
        }, default);
        Assert.Empty(result.Errors);
        Assert.True((await settings.GetAsync()).IsConfigured);
    }

    [Theory]
    [InlineData("client-id", null, "invalid_client_id")]
    [InlineData(null, "https://family.example/wrong", "invalid_redirect_uri")]
    [InlineData("other.apps.googleusercontent.com", null, "matching_secret_required")]
    public async Task Invalid_or_mixed_client_configuration_is_rejected(string? clientId, string? uri, string code)
    {
        using var database = TestDbContextFactory.CreateSqlite();
        var config = Configuration();
        var settings = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Encryption(config), Options.Create(Defaults(config)), config);
        var result = await settings.SaveAsync(new() { OverrideEnabled = true, ClientId = clientId, RedirectUri = uri }, default);
        Assert.Contains(code, result.Errors.Values);
        Assert.False((await settings.StatusAsync()).AdminSettingsStored);
    }

    [Fact]
    public void Admin_endpoints_require_platform_admin_instead_of_a_tenant_role()
    {
        var attribute = Assert.Single(typeof(GoogleHealthAdminController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>());
        Assert.Equal("platform_admin", attribute.Roles);
        Assert.Empty(typeof(GoogleHealthAdminController).GetCustomAttributes(typeof(AllowAnonymousAttribute), true));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Unreadable_active_overrides_fail_closed_but_disabled_overrides_do_not_block_env(bool enabled)
    {
        using var database = TestDbContextFactory.CreateSqlite();
        var config = Configuration();
        var configured = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Encryption(config), Options.Create(Defaults(config)), config);
        await configured.SaveAsync(new() { OverrideEnabled = enabled, ClientSecret = "encrypted-admin-secret" }, default);
        var unavailable = new GoogleHealthAdminSettings(database.ContextFactory.AsNocturneFactory(), Mock.Of<ISecretEncryptionService>(), Options.Create(Defaults(config)), config);
        if (enabled) await Assert.ThrowsAsync<InvalidOperationException>(() => unavailable.GetAsync());
        else Assert.Equal("deployment-secret", (await unavailable.GetAsync()).ClientSecret);
    }
}
