using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nocturne.API.Services.Health.GoogleHealth;
using OpenApi.Remote.Attributes;

namespace Nocturne.API.Controllers.V4.PlatformAdmin;

[ApiController]
[Tags("GoogleHealthAdmin")]
[Route("api/v4/admin/platform-settings/google-health")]
[Authorize(Roles = "platform_admin")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class GoogleHealthAdminController(GoogleHealthAdminSettings settings) : ControllerBase
{
    [HttpGet]
    [RemoteQuery]
    [ProducesResponseType(typeof(GoogleHealthAdminStatus), StatusCodes.Status200OK)]
    public async Task<ActionResult<GoogleHealthAdminStatus>> GetGoogleHealthAdminSettings(CancellationToken ct) =>
        Ok(await settings.StatusAsync(ct));

    [HttpPut]
    [RemoteCommand(Invalidates = ["GetGoogleHealthAdminSettings"])]
    [ProducesResponseType(typeof(GoogleHealthAdminSaveResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(GoogleHealthAdminSaveResult), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<GoogleHealthAdminSaveResult>> SaveGoogleHealthAdminSettings(
        SaveGoogleHealthAdminRequest request, CancellationToken ct)
    {
        var result = await settings.SaveAsync(request, ct);
        return result.Errors.Count > 0 ? UnprocessableEntity(result) : Ok(result);
    }

    [HttpDelete]
    [RemoteCommand(Invalidates = ["GetGoogleHealthAdminSettings"])]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveGoogleHealthAdminSettings(CancellationToken ct)
    {
        await settings.RemoveAsync(ct);
        return NoContent();
    }
}
