using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Nocturne.API.Controllers.V4.Platform;
using Nocturne.API.Services;
using Nocturne.API.Multitenancy;
using Moq;
using Nocturne.Core.Contracts.Auth;
using Nocturne.Infrastructure.Data.Entities;
using Nocturne.Tests.Shared.Infrastructure;

namespace Nocturne.API.Tests.Services;

public class PublicPrivacySettingsTests
{
    private static Dictionary<string, string> Valid() => new()
    {
        ["appName"] = "Family Nocturne",
        ["operatorName"] = "Example operator",
        ["contactEmail"] = "privacy@example.com",
        ["hosting"] = "Hosted locally",
        ["sharing"] = "Invited accounts only",
        ["retention"] = "Until deletion is requested",
        ["backups"] = "Local backups retained for 30 days",
        ["effectiveDate"] = "2026-10-22",
    };

    [Fact]
    public void Disabled_policy_does_not_publish_contact_information()
    {
        var policy = PlatformSettingsService.PublishedPrivacy(false, Valid());
        policy.Published.Should().BeFalse();
        policy.ContactEmail.Should().BeNull();
        policy.OperatorName.Should().BeNull();
    }

    [Theory]
    [InlineData("contactEmail", "")]
    [InlineData("contactEmail", "Name <privacy@example.com>")]
    [InlineData("contactEmail", "privacy@example.com\r\nBcc: other@example.com")]
    [InlineData("effectiveDate", "2026-02-30")]
    [InlineData("effectiveDate", "22/10/2026")]
    [InlineData("backups", "")]
    public void Incomplete_or_invalid_policy_is_not_published(string field, string value)
    {
        var fields = Valid();
        fields[field] = value;
        PlatformSettingsService.PublishedPrivacy(true, fields).Published.Should().BeFalse();
    }

    [Fact]
    public void Public_projection_contains_only_the_explicit_policy_fields()
    {
        var fields = Valid();
        fields["clientSecret"] = "must-never-escape";
        var policy = PlatformSettingsService.PublishedPrivacy(true, fields);
        policy.Published.Should().BeTrue();
        policy.ContactEmail.Should().Be("privacy@example.com");
        JsonSerializer.Serialize(policy).Should().NotContain("must-never-escape");
    }

    [Fact]
    public void Every_required_field_is_checked_before_publication()
    {
        foreach (var key in Valid().Keys)
        {
            var fields = Valid();
            fields.Remove(key);
            PlatformSettingsService.PublishedPrivacy(true, fields).Published.Should().BeFalse(key);
        }
    }

    [Fact]
    public void The_public_policy_can_be_read_without_a_Nocturne_session()
    {
        typeof(PrivacyController).GetMethod(nameof(PrivacyController.GetPublicPrivacySettings))!
            .GetCustomAttributes(typeof(AllowAnonymousAttribute), false).Should().ContainSingle();
        TenantResolutionMiddleware.IsTenantlessAllowed("/api/v4/privacy", "GET").Should().BeTrue();
        TenantResolutionMiddleware.IsTenantlessAllowed("/api/v4/privacy", "PUT").Should().BeFalse();
        TenantResolutionMiddleware.IsTenantlessAllowed("/api/v4/privacy/secrets", "GET").Should().BeFalse();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Public_read_never_decrypts_another_platforms_credentials(bool published)
    {
        using var database = TestDbContextFactory.CreateSqlite();
        await using (var db = database.CreateContext())
        {
            db.PlatformSettings.AddRange(
                new PlatformSettingsEntity
                {
                    Id = Guid.NewGuid(), Category = "privacy", Enabled = published,
                    EncryptedJson = "{\"marker\":\"policy\"}",
                },
                new PlatformSettingsEntity
                {
                    Id = Guid.NewGuid(), Category = "discord", Enabled = true,
                    EncryptedJson = "{\"botToken\":\"private-bot-token\"}",
                });
            await db.SaveChangesAsync();
        }
        var encryption = new Mock<ISecretEncryptionService>(MockBehavior.Strict);
        encryption.SetupGet(value => value.IsConfigured).Returns(true);
        encryption.Setup(value => value.DecryptSecrets(It.Is<Dictionary<string, string>>(
            fields => fields.Count == 1 && fields.ContainsKey("marker") && fields["marker"] == "policy")))
            .Returns(Valid());
        var service = new PlatformSettingsService(database.ContextFactory.AsNocturneFactory(), encryption.Object);
        var policy = await service.GetPublishedPrivacyAsync();
        policy.Published.Should().Be(published);
        policy.ContactEmail.Should().Be(published ? "privacy@example.com" : null);
        encryption.Verify(value => value.DecryptSecrets(It.IsAny<Dictionary<string, string>>()),
            published ? Times.Once() : Times.Never());
    }
}
