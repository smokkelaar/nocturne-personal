using System.ComponentModel.DataAnnotations;

namespace Nocturne.Core.Models.Personal;

public class GoogleHealthOptions
{
    [Required, MaxLength(200)] public string ClientId { get; set; } = "";
    [MaxLength(500)] public string? ClientSecret { get; set; }
    [Required, MaxLength(500)] public string CallbackUrl { get; set; } = "";
    [MinLength(1), MaxLength(32)] public string[] DataTypes { get; set; } = [];
    [Range(1, 90)] public int HistoryDays { get; set; } = 7;
}

public class GoogleHealthStatus
{
    public GoogleHealthCapability[] Capabilities { get; set; } = [];
    public bool Configured { get; set; }
    public bool Connected { get; set; }
    public string ClientId { get; set; } = "";
    public string CallbackUrl { get; set; } = "";
    public string[] SelectedTypes { get; set; } = [];
    public string[] GrantedTypes { get; set; } = [];
    public int HistoryDays { get; set; } = 7;
    public DateTimeOffset? LastSync { get; set; }
    public string? ErrorCode { get; set; }
}

public class GoogleHealthCapability
{
    public string DataType { get; set; } = "";
    public bool Supported { get; set; }
}

public class GoogleHealthAuthorize { public string Url { get; set; } = ""; }
public class GoogleHealthCallback
{
    [Required, MaxLength(256)] public string State { get; set; } = "";
    [Required, MaxLength(4096)] public string Code { get; set; } = "";
}

public class PersonalHealthReading
{
    public string DataType { get; set; } = "";
    public long Mills { get; set; }
    public long? EndMills { get; set; }
    public int? UtcOffsetMinutes { get; set; }
    public decimal Value { get; set; }
    public string Unit { get; set; } = "";
}

public class PersonalMedicationInput : IValidatableObject
{
    [Required, MaxLength(120)] public string Name { get; set; } = "";
    [Required, MaxLength(120)] public string Ingredient { get; set; } = "";
    public decimal? Amount { get; set; }
    [Required, RegularExpression("^(mg|microgram)$")] public string Unit { get; set; } = "mg";
    [Required, RegularExpression("^(taken|skipped)$")] public string Status { get; set; } = "taken";
    [Required, RegularExpression("^(subcutaneous|oral|other)$")] public string Route { get; set; } = "subcutaneous";
    public long Mills { get; set; }
    [Range(-840, 840)] public int UtcOffsetMinutes { get; set; }
    [MaxLength(120)] public string? Site { get; set; }
    [MaxLength(2000)] public string? Notes { get; set; }
    public Guid Revision { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Name) || string.IsNullOrWhiteSpace(Ingredient))
            yield return new ValidationResult("medication_name_required", [nameof(Name)]);
        if (Status == "taken" && (Amount is null || Amount <= 0 || Amount > 100000 || decimal.Round(Amount.Value, 4) != Amount))
            yield return new ValidationResult("medication_amount_invalid", [nameof(Amount)]);
        if (Status == "skipped" && Amount is not null)
            yield return new ValidationResult("skipped_has_no_dose", [nameof(Amount)]);
        if (Mills < 0 || Mills > DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeMilliseconds())
            yield return new ValidationResult("actual_time_required", [nameof(Mills)]);
    }
}

public class PersonalMedicationRecord : PersonalMedicationInput
{
    public Guid Id { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
