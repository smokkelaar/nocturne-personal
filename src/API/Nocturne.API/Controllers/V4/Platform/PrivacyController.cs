using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nocturne.API.Services;
using OpenApi.Remote.Attributes;

namespace Nocturne.API.Controllers.V4.Platform;

[ApiController]
[Tags("Privacy")]
[Route("api/v4/privacy")]
public sealed class PrivacyController(PlatformSettingsService settings) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [RemoteQuery]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(PublicPrivacySettings), StatusCodes.Status200OK)]
    public async Task<ActionResult<PublicPrivacySettings>> GetPublicPrivacySettings() =>
        Ok(await settings.GetPublishedPrivacyAsync());
}
