using Nocturne.Core.Models;

namespace Nocturne.Core.Contracts.Entries;

/// <summary>
/// A stored reading an upload duplicates, as <see cref="IEntryStore.CheckDuplicatesAsync"/> found it.
/// </summary>
/// <param name="Entry">The stored reading in the legacy shape.</param>
/// <param name="LegacyId">The stored row's legacy id, or <c>null</c> for a row that has none and is
/// served under its own uuid.</param>
public sealed record StoredEntryMatch(Entry Entry, string? LegacyId);
