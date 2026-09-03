using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Nocturne.API.Controllers.V4.Personal;
using Nocturne.API.Services.Personal;
using Nocturne.Core.Contracts.Health;
using Nocturne.Core.Models.Personal;
using Nocturne.Infrastructure.Data;
using Nocturne.Infrastructure.Data.Entities;
using Xunit;

namespace Nocturne.API.Tests.Personal;

public class PersonalHealthTests
{
    [Theory]
    [InlineData("weight", "{\"weight\":{\"sampleTime\":{\"physicalTime\":\"2026-09-01T10:00:00Z\",\"utcOffset\":\"7200s\"},\"weightGrams\":72500}}", "kg", 72.5)]
    [InlineData("heart-rate", "{\"heartRate\":{\"sampleTime\":{\"physicalTime\":\"2026-09-01T10:00:00Z\"},\"beatsPerMinute\":\"67\"}}", "bpm", 67)]
    [InlineData("steps", "{\"steps\":{\"interval\":{\"startTime\":\"2026-09-01T12:00:00+02:00\",\"endTime\":\"2026-09-01T12:01:00+02:00\"},\"count\":\"42\"}}", "steps", 42)]
    public void Maps_documented_google_types_without_inventing_values(string type, string json, string unit, decimal expected)
    {
        using var doc = JsonDocument.Parse(json);
        var reading = GoogleHealthClient.Parse(type, doc.RootElement);
        Assert.Equal(expected, reading.Value); Assert.Equal(unit, reading.Unit);
        Assert.Equal(DateTimeOffset.Parse("2026-09-01T10:00:00Z").ToUnixTimeMilliseconds(), reading.Mills);
        if (type == "weight") Assert.Equal(120, reading.UtcOffsetMinutes);
        else Assert.Null(reading.UtcOffsetMinutes);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"heartRate\":{\"sampleTime\":{\"physicalTime\":\"2026-09-01T10:00:00Z\"}}}")]
    [InlineData("{\"heartRate\":{\"sampleTime\":{\"physicalTime\":\"2026-09-01T10:00:00Z\"},\"beatsPerMinute\":\"-1\"}}")]
    [InlineData("{\"heartRate\":{\"sampleTime\":{\"physicalTime\":\"2026-09-01T10:00:00Z\"},\"beatsPerMinute\":\"60.5\"}}")]
    public void Rejects_missing_or_invalid_samples(string json)
    {
        using var doc = JsonDocument.Parse(json);
        Assert.Throws<GoogleHealthException>(() => GoogleHealthClient.Parse("heart-rate", doc.RootElement));
    }

    [Theory]
    [InlineData("http://example.com/personal/google/callback")]
    [InlineData("https://192.168.2.238/personal/google/callback")]
    [InlineData("https://example.com/personal/google/callback?x=1")]
    [InlineData("https://user@example.com/personal/google/callback")]
    [InlineData("https://example.com/auth/login")]
    public void Requires_exact_https_callback(string url)
    {
        var options = Options(); options.CallbackUrl = url;
        Assert.Throws<GoogleHealthException>(() => GoogleHealthService.ValidateOptions(options));
    }

    [Fact]
    public void Medication_validation_has_no_default_dose_or_future_plan()
    {
        var input = Medication();
        Assert.True(Valid(input));
        input.Amount = null; Assert.False(Valid(input));
        input.Status = "skipped"; Assert.True(Valid(input));
        input.Amount = 1; Assert.False(Valid(input));
        input.Status = "taken"; input.Unit = "units"; Assert.False(Valid(input));
        input.Unit = "mL"; Assert.False(Valid(input));
        input.Unit = "mg"; input.Amount = 0; Assert.False(Valid(input));
        input.Amount = 1; input.Mills = DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeMilliseconds(); Assert.False(Valid(input));
    }

    [Fact]
    public async Task Follows_pages_and_rejects_repeated_page_tokens()
    {
        var calls = 0;
        var handler = new StubHandler(_ => Json(++calls == 1 ? "{\"nextPageToken\":\"second\"}" : "{\"dataPoints\":[]}"));
        var client = new GoogleHealthClient(new HttpClient(handler));
        Assert.Empty(await client.ReadAsync("synthetic-token", "weight", DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow, default));
        Assert.Equal(2, calls);
        handler.Responder = _ => Json("{\"nextPageToken\":\"repeated\"}");
        await Assert.ThrowsAsync<GoogleHealthException>(() => client.ReadAsync("synthetic-token", "weight", DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow, default));
    }

    [Fact]
    public async Task Stores_encrypted_oauth_and_imports_atomically_with_tenant_isolation()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        await using var db = new NocturneDbContext(new DbContextOptionsBuilder<NocturneDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var tenant = Guid.NewGuid(); var subject = Guid.NewGuid();
        db.TenantId = tenant;
        db.Tenants.Add(new TenantEntity { Id = tenant, Slug = "synthetic", DisplayName = "Synthetic", IsActive = true }); await db.SaveChangesAsync();
        var observation = DateTimeOffset.UtcNow.AddHours(-1).ToString("O");
        var grams = 72000;
        var handler = new StubHandler(request => request.RequestUri!.AbsolutePath switch
        {
            "/token" => Json($$"""{"access_token":"synthetic-access","refresh_token":"synthetic-refresh","scope":"openid {{GoogleHealthClient.MetricsScope}}"}"""),
            "/v1/userinfo" => Json("{\"sub\":\"synthetic-account\"}"),
            "/revoke" => Json("{}"),
            _ => Json(JsonSerializer.Serialize(new { dataPoints = new[] { new { weight = new { sampleTime = new { physicalTime = observation }, weightGrams = grams } } } }))
        });
        var service = new GoogleHealthService(db, new EphemeralDataProtectionProvider(), new GoogleHealthCoordinator(), new GoogleHealthClient(new HttpClient(handler)));
        var options = Options(); options.DataTypes = ["steps", "weight"];
        await service.SaveAsync(options, subject, default);
        var auth = await service.StartAsync(subject, default);
        var query = QueryHelpers.ParseQuery(new Uri(auth.Url).Query);
        Assert.Equal("S256", query["code_challenge_method"]); Assert.Contains("readonly", query["scope"].ToString());
        var callback = new GoogleHealthCallback { Code = "synthetic-code", State = query["state"].ToString() };
        await Assert.ThrowsAsync<GoogleHealthException>(() => service.CompleteAsync(callback, Guid.NewGuid(), default));
        await service.CompleteAsync(callback, subject, default);
        await Assert.ThrowsAsync<GoogleHealthException>(() => service.CompleteAsync(callback, subject, default));
        var status = await service.StatusAsync(default);
        Assert.Equal(["weight"], status.GrantedTypes); Assert.Equal("partial_consent", status.ErrorCode);
        var stored = await db.PersonalGoogleConnections.SingleAsync();
        Assert.DoesNotContain("synthetic-secret", stored.ProtectedSettings); Assert.DoesNotContain("synthetic-refresh", stored.ProtectedToken!);
        await service.SyncAsync(true, default); Assert.Equal(72m, (await db.PersonalHealthReadings.SingleAsync()).Value);
        grams = 73000; await service.SyncAsync(true, default);
        Assert.Single(await db.PersonalHealthReadings.ToListAsync()); Assert.Equal(73m, (await db.PersonalHealthReadings.AsNoTracking().SingleAsync()).Value);
        handler.Responder = _ => new HttpResponseMessage(HttpStatusCode.TooManyRequests);
        await service.SyncAsync(true, default); Assert.Single(await db.PersonalHealthReadings.ToListAsync());
        db.TenantId = Guid.NewGuid(); Assert.Empty(await db.PersonalHealthReadings.ToListAsync()); Assert.Empty(await db.PersonalGoogleConnections.ToListAsync());
        db.TenantId = tenant;
        await service.DisconnectAsync(subject, default);
        Assert.False((await service.StatusAsync(default)).Connected); Assert.Single(await db.PersonalHealthReadings.ToListAsync());
        await service.PurgeAsync(subject, default); Assert.Empty(await db.PersonalHealthReadings.ToListAsync());

        handler.Responder = request => request.RequestUri!.AbsolutePath switch
        {
            "/token" => Json(JsonSerializer.Serialize(new { access_token = "synthetic-access", refresh_token = "synthetic-refresh", scope = $"openid {GoogleHealthClient.MetricsScope} {GoogleHealthClient.ActivityScope}" })),
            "/v1/userinfo" => Json("{\"sub\":\"synthetic-account\"}"),
            var path when path.Contains("/steps/") => Json(JsonSerializer.Serialize(new { dataPoints = new[] { new { steps = new { interval = new { startTime = observation, endTime = DateTimeOffset.Parse(observation).AddMinutes(1).ToString("O") }, count = "42" } } } })),
            var path when path.Contains("/heart-rate/") => Json(JsonSerializer.Serialize(new { dataPoints = new[] { new { heartRate = new { sampleTime = new { physicalTime = observation }, beatsPerMinute = "65" } } } })),
            _ => Json(JsonSerializer.Serialize(new { dataPoints = new[] { new { weight = new { sampleTime = new { physicalTime = observation }, weightGrams = 71000 } } } }))
        };
        options.DataTypes = ["steps", "heart-rate", "weight"];
        await service.SaveAsync(options, subject, default);
        query = QueryHelpers.ParseQuery(new Uri((await service.StartAsync(subject, default)).Url).Query);
        await service.CompleteAsync(new() { State = query["state"].ToString(), Code = "synthetic-code" }, subject, default);
        await service.SyncAsync(true, default);
        Assert.Equal(3, await db.PersonalHealthReadings.CountAsync());
        Assert.Equal(42m, (await db.PersonalHealthReadings.SingleAsync(x => x.DataType == "steps")).Value);
        Assert.Equal(65m, (await db.PersonalHealthReadings.SingleAsync(x => x.DataType == "heart-rate")).Value);
        Assert.Equal(71m, (await db.PersonalHealthReadings.SingleAsync(x => x.DataType == "weight")).Value);
        var controller = new PersonalGoogleHealthController(service, db);
        foreach (var type in options.DataTypes)
            Assert.Single(Assert.IsType<List<PersonalHealthReading>>(Assert.IsType<OkObjectResult>((await controller.GetPersonalHealthReadings(type)).Result).Value));
    }

    [Fact]
    public void Future_catalog_entries_cannot_be_silently_selected()
    {
        var options = Options(); options.DataTypes = ["sleep"];
        Assert.Contains(GoogleHealthClient.Capabilities, c => c.DataType == "sleep" && !c.Supported);
        Assert.Throws<GoogleHealthException>(() => GoogleHealthService.ValidateOptions(options));
    }

    [Fact]
    public async Task Medication_crud_preserves_dose_and_rejects_stale_edits()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        await using var db = new NocturneDbContext(new DbContextOptionsBuilder<NocturneDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync(); db.TenantId = Guid.NewGuid();
        db.Tenants.Add(new TenantEntity { Id = db.TenantId, Slug = "synthetic", DisplayName = "Synthetic", IsActive = true }); await db.SaveChangesAsync();
        var controller = new PersonalMedicationController(db); var id = Guid.NewGuid(); var input = Medication();
        var saved = Assert.IsType<PersonalMedicationRecord>(Assert.IsType<OkObjectResult>((await controller.SavePersonalMedication(id, input, default)).Result).Value);
        Assert.Equal(1.25m, saved.Amount); Assert.Equal("mg", saved.Unit);
        Assert.IsType<ConflictResult>((await controller.SavePersonalMedication(id, input, default)).Result);
        input.Revision = saved.Revision; input.Status = "skipped"; input.Amount = null;
        var updated = Assert.IsType<PersonalMedicationRecord>(Assert.IsType<OkObjectResult>((await controller.SavePersonalMedication(id, input, default)).Result).Value);
        Assert.Null(updated.Amount); Assert.Equal("skipped", updated.Status);
        Assert.IsType<ConflictResult>(await controller.DeletePersonalMedication(id, saved.Revision, default));
        Assert.IsType<NoContentResult>(await controller.DeletePersonalMedication(id, updated.Revision, default));
        Assert.Empty(await db.PersonalMedications.ToListAsync());
    }

    [Fact]
    public async Task Sync_returns_problem_details_when_google_is_unavailable()
    {
        var controller = new PersonalGoogleHealthController(new ThrowingGoogleHealthService(), null!);

        var result = await controller.SyncPersonalGoogleHealth(default);

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(502, response.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(response.Value);
        Assert.Equal("google_unavailable", problem.Detail);
    }

    private static bool Valid(object value) => Validator.TryValidateObject(value, new ValidationContext(value), new List<ValidationResult>(), true);
    private static GoogleHealthOptions Options() => new() { ClientId = "synthetic.apps.googleusercontent.com", ClientSecret = "synthetic-secret", CallbackUrl = "https://example.test:8450/personal/google/callback", DataTypes = ["weight"] };
    private static PersonalMedicationInput Medication() => new() { Name = "Synthetic medicine", Ingredient = "Synthetic ingredient", Amount = 1.25m, Mills = DateTimeOffset.UtcNow.AddHours(-1).ToUnixTimeMilliseconds() };
    private static HttpResponseMessage Json(string text) => new(HttpStatusCode.OK) { Content = new StringContent(text, Encoding.UTF8, "application/json") };
    private sealed class ThrowingGoogleHealthService : IPersonalGoogleHealthService
    {
        public Task<GoogleHealthStatus> StatusAsync(CancellationToken ct) => Task.FromResult(new GoogleHealthStatus());
        public Task SaveAsync(GoogleHealthOptions options, Guid subject, CancellationToken ct) => Task.CompletedTask;
        public Task<GoogleHealthAuthorize> StartAsync(Guid subject, CancellationToken ct) => Task.FromResult(new GoogleHealthAuthorize());
        public Task CompleteAsync(GoogleHealthCallback callback, Guid subject, CancellationToken ct) => Task.CompletedTask;
        public Task DisconnectAsync(Guid subject, CancellationToken ct) => Task.CompletedTask;
        public Task PurgeAsync(Guid subject, CancellationToken ct) => Task.CompletedTask;
        public Task SyncAsync(bool force, CancellationToken ct) => throw new HttpRequestException("synthetic");
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        public Func<HttpRequestMessage, HttpResponseMessage> Responder { get; set; } = responder;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(Responder(request));
    }
}
