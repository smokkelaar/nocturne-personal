namespace Nocturne.API.Services;

public sealed class PublicPrivacySettings
{
    public bool Published { get; init; }
    public string? AppName { get; init; }
    public string? OperatorName { get; init; }
    public string? ContactEmail { get; init; }
    public string? Hosting { get; init; }
    public string? Sharing { get; init; }
    public string? Retention { get; init; }
    public string? Backups { get; init; }
    public string? EffectiveDate { get; init; }
}
