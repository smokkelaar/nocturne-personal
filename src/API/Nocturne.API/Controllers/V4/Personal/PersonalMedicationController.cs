using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nocturne.API.Attributes;
using Nocturne.API.Authorization;
using Nocturne.Core.Models.Authorization;
using Nocturne.Core.Models.Personal;
using Nocturne.Infrastructure.Data;
using Nocturne.Infrastructure.Data.Entities;
using OpenApi.Remote.Attributes;

namespace Nocturne.API.Controllers.V4.Personal;

[ApiController, Authorize, DenyDemoSubject, RequireScope(Scope.TenantSettings)]
[Route("api/v4/personal/medications")]
public class PersonalMedicationController(NocturneDbContext db) : ControllerBase
{
    [HttpGet, RemoteQuery, RequireScope(Scope.TherapyRead)]
    [ProducesResponseType(typeof(List<PersonalMedicationRecord>), 200)]
    public async Task<ActionResult<List<PersonalMedicationRecord>>> ListPersonalMedications(int skip = 0, CancellationToken ct = default)
    {
        var rows = await db.PersonalMedications.AsNoTracking().OrderByDescending(x => x.Mills).ThenBy(x => x.Id)
            .Skip(Math.Clamp(skip, 0, 1000000)).Take(100).ToListAsync(ct);
        return Ok(rows.Select(Map).ToList());
    }

    [HttpPut("{id:guid}"), RemoteCommand, RequireScope(Scope.TherapyReadWrite)]
    [ProducesResponseType(typeof(PersonalMedicationRecord), 200)]
    public async Task<ActionResult<PersonalMedicationRecord>> SavePersonalMedication(Guid id, PersonalMedicationInput input, CancellationToken ct)
    {
        if (db.TenantId == Guid.Empty || id == Guid.Empty) return BadRequest();
        var row = await db.PersonalMedications.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (row is null)
        {
            if (input.Revision != Guid.Empty) return Conflict();
            row = new PersonalMedicationEntity { Id = id };
            db.PersonalMedications.Add(row);
        }
        else if (input.Revision != row.Revision) return Conflict();
        row.Name = input.Name.Trim(); row.Ingredient = input.Ingredient.Trim(); row.Amount = input.Amount;
        row.Unit = input.Unit; row.Status = input.Status; row.Route = input.Route; row.Mills = input.Mills;
        row.UtcOffsetMinutes = input.UtcOffsetMinutes; row.Site = input.Site?.Trim(); row.Notes = input.Notes?.Trim();
        row.Revision = Guid.NewGuid();
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { return Conflict(); }
        return Ok(Map(row));
    }

    [HttpDelete("{id:guid}"), RemoteCommand, RequireScope(Scope.TherapyReadWrite)]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeletePersonalMedication(Guid id, Guid revision, CancellationToken ct)
    {
        var row = await db.PersonalMedications.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (row is null) return NotFound();
        if (revision != row.Revision) return Conflict();
        db.PersonalMedications.Remove(row);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { return Conflict(); }
        return NoContent();
    }

    private static PersonalMedicationRecord Map(PersonalMedicationEntity row) => new()
    {
        Id = row.Id, Name = row.Name, Ingredient = row.Ingredient, Amount = row.Amount, Unit = row.Unit,
        Status = row.Status, Route = row.Route, Mills = row.Mills, UtcOffsetMinutes = row.UtcOffsetMinutes,
        Site = row.Site, Notes = row.Notes, Revision = row.Revision, UpdatedAt = new DateTimeOffset(DateTime.SpecifyKind(row.SysUpdatedAt, DateTimeKind.Utc))
    };
}
