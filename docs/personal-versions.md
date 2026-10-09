# Personal source versions

## 0.3.28 — 2026-10-09

Updated to the newest published upstream main snapshot `df000c33e15d3809591261d78a22135bb0176ffd`.
Includes dashboard/chart refresh fixes (PR #2019), v3 history and user-deletion
fixes (#1825), and uploader-origin handling for temporary basals (#1570).
Personal extensions remain present. The later translation-only upstream commit
`d106f6085` skips image publication and is not part of this compiled snapshot.

## 0.3.27 — 2026-10-09

Updated to upstream Nocturne main `ef8850840c349fa9519a7f3022599ec9adddff82`
(2026-10-09 06:48:03 UTC). Personal retains Google Health imports and its
HbA1c method comparison and year-overview presentation extensions.

This base includes the merged clock-face display settings (upstream PR #2007),
hypoglycemia comparison metrics (#2031), year-overview performance work and
combined v3 filter operator fixes (#2025). Google Health PR #1293 remains open;
Personal is not an official Nocturne release.

The merge preserves Google Health sleep-record updates while incorporating
upstream sleep-session locks and user-deletion protection. Analytics tests use
upstream's stable query interceptors with Personal's daily HbA1c test readings.

The Home Assistant package version is generated separately after native builds,
startup checks and upgrade tests pass. See the HA wrapper's `upstream-personal.json`
and published `nocturne_personal/provenance.json` for the deployed source and image.
