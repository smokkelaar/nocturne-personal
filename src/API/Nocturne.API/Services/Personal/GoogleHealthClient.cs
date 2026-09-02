using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Nocturne.Core.Models.Personal;

namespace Nocturne.API.Services.Personal;

public sealed class GoogleHealthException(string code, TimeSpan? retryAfter = null) : Exception(code)
{
    public TimeSpan? RetryAfter { get; } = retryAfter;
}

public sealed class GoogleHealthClient(HttpClient http)
{
    public const string ActivityScope = "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";
    public const string MetricsScope = "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";
    public static readonly GoogleHealthCapability[] Capabilities =
    [
        new() { DataType = "steps", Supported = true }, new() { DataType = "heart-rate", Supported = true },
        new() { DataType = "weight", Supported = true }, new() { DataType = "sleep" }, new() { DataType = "body-fat" },
        new() { DataType = "distance" }, new() { DataType = "oxygen-saturation" }, new() { DataType = "heart-rate-variability" }
    ];
    public static string[] SupportedTypes => Capabilities.Where(c => c.Supported).Select(c => c.DataType).ToArray();
    public static string ScopeFor(string type) => type switch
    {
        "steps" => ActivityScope,
        "heart-rate" or "weight" => MetricsScope,
        _ => throw new GoogleHealthException("unsupported_type")
    };

    public async Task<JsonElement> ExchangeAsync(Dictionary<string, string> form, CancellationToken ct)
    {
        using var response = await http.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(form), ct);
        if (!response.IsSuccessStatusCode)
            throw new GoogleHealthException(response.StatusCode switch
            {
                System.Net.HttpStatusCode.BadRequest => "reconnect_required",
                System.Net.HttpStatusCode.TooManyRequests => "rate_limited",
                _ => "google_unavailable"
            }, response.Headers.RetryAfter?.Delta ?? (response.Headers.RetryAfter?.Date - DateTimeOffset.UtcNow));
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        return json.RootElement.Clone();
    }

    public async Task<bool> RevokeAsync(string refreshToken, CancellationToken ct)
    {
        using var response = await http.PostAsync("https://oauth2.googleapis.com/revoke",
            new FormUrlEncodedContent(new Dictionary<string, string> { ["token"] = refreshToken }), ct);
        return response.IsSuccessStatusCode;
    }

    public async Task<string> AccountKeyAsync(string token, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://openidconnect.googleapis.com/v1/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) throw new GoogleHealthException("reconnect_required");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        var subject = json.RootElement.GetProperty("sub").GetString();
        if (string.IsNullOrEmpty(subject)) throw new GoogleHealthException("reconnect_required");
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(subject)));
    }

    public async Task<List<PersonalHealthReading>> ReadAsync(string token, string type, DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        var field = type == "steps" ? "steps.interval.start_time" : $"{type.Replace('-', '_')}.sample_time.physical_time";
        var filter = $"{field} >= \"{from.UtcDateTime:O}\" AND {field} < \"{to.UtcDateTime:O}\"";
        var root = $"https://health.googleapis.com/v4/users/me/dataTypes/{type}/dataPoints:reconcile?pageSize=10000&filter={Uri.EscapeDataString(filter)}";
        var points = new List<PersonalHealthReading>();
        var seen = new HashSet<string>();
        var pageToken = "";
        for (var page = 0; page < 100; page++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, root + "&pageToken=" + Uri.EscapeDataString(pageToken));
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var response = await http.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
                throw new GoogleHealthException(response.StatusCode switch
                {
                    System.Net.HttpStatusCode.Unauthorized => "reconnect_required",
                    System.Net.HttpStatusCode.Forbidden => "permission_denied",
                    System.Net.HttpStatusCode.TooManyRequests => "rate_limited",
                    _ => "google_unavailable"
                }, response.Headers.RetryAfter?.Delta ?? (response.Headers.RetryAfter?.Date - DateTimeOffset.UtcNow));
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            if (json.RootElement.TryGetProperty("dataPoints", out var data))
                foreach (var item in data.EnumerateArray())
                {
                    var point = Parse(type, item);
                    if (point.Mills < from.ToUnixTimeMilliseconds() || point.Mills >= to.ToUnixTimeMilliseconds())
                        throw new GoogleHealthException("unexpected_time_range");
                    points.Add(point);
                }
            pageToken = json.RootElement.TryGetProperty("nextPageToken", out var next) ? next.GetString() ?? "" : "";
            if (pageToken.Length == 0) return points;
            if (!seen.Add(pageToken)) throw new GoogleHealthException("pagination_failed");
        }
        throw new GoogleHealthException("history_too_large");
    }

    public static string Key(PersonalHealthReading reading) => Convert.ToHexString(SHA256.HashData(
        Encoding.UTF8.GetBytes($"{reading.DataType}|{reading.Mills}|{reading.EndMills}")));

    public static PersonalHealthReading Parse(string type, JsonElement point)
    {
        try
        {
            var payload = point.GetProperty(type == "heart-rate" ? "heartRate" : type);
            var interval = type == "steps";
            var time = payload.GetProperty(interval ? "interval" : "sampleTime");
            var start = DateTimeOffset.Parse(time.GetProperty(interval ? "startTime" : "physicalTime").GetString()!, CultureInfo.InvariantCulture);
            long? end = interval ? DateTimeOffset.Parse(time.GetProperty("endTime").GetString()!, CultureInfo.InvariantCulture).ToUnixTimeMilliseconds() : null;
            var valueName = type switch { "steps" => "count", "heart-rate" => "beatsPerMinute", "weight" => "weightGrams", _ => throw new GoogleHealthException("unsupported_type") };
            var value = decimal.Parse(payload.GetProperty(valueName).ToString(), CultureInfo.InvariantCulture);
            if (value < 0 || (type != "steps" && value == 0) || (type != "weight" && decimal.Truncate(value) != value) || (end.HasValue && end.Value <= start.ToUnixTimeMilliseconds()))
                throw new GoogleHealthException("invalid_google_data");
            int? offset = null;
            if (time.TryGetProperty(interval ? "startUtcOffset" : "utcOffset", out var offsetValue))
            {
                var seconds = decimal.Parse(offsetValue.GetString()!.TrimEnd('s'), CultureInfo.InvariantCulture);
                if (seconds % 60 != 0 || Math.Abs(seconds) > 50400) throw new GoogleHealthException("invalid_google_data");
                offset = (int)(seconds / 60);
            }
            return new PersonalHealthReading
            {
                DataType = type, Mills = start.ToUnixTimeMilliseconds(), EndMills = end, UtcOffsetMinutes = offset,
                Value = type == "weight" ? value / 1000m : value,
                Unit = type switch { "weight" => "kg", "heart-rate" => "bpm", _ => "steps" }
            };
        }
        catch (Exception ex) when (ex is KeyNotFoundException or FormatException or InvalidOperationException or OverflowException or ArgumentException)
        {
            throw new GoogleHealthException("invalid_google_data");
        }
    }
}
