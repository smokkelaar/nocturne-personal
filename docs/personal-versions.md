# Personal source versions

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
