# Phase 8F.7 — Retired Device Safety Export Manifest Summary

Date: 2026-08-20

Status: Verified non-sensitive summary. Raw production exports remain outside Git.

## Protected artifacts

- export directory: `C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f7_retired_device_safety_export_20260820T170241Z`
- manifest: `manifest.json`
- manifest SHA-256: `878ecb7e3b5c7e6bf3af325e5867919e7822708cf898d84e16c094cb1a8b83dc`
- downloadable ZIP: `C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f7_retired_device_safety_export_20260820T170241Z.zip`
- ZIP bytes: 6,538,663
- ZIP SHA-256: `8e7ddb7d66ab3f0145a8da0d12720d8d9336703af1824c5527041b7011dfb71d`
- ZIP entries: 26
- ZIP integrity check: pass

The export used a single `repeatable read, read only` PostgreSQL snapshot. Database result count, written count, and re-parsed JSONL count agree for every row file. Before/after retired, protected, full-table, and schema-metadata checks agree. A later deletion slice must refresh or reconfirm these results because the database can change after the export timestamp.

## Row files

Every row file is UTF-8 JSONL with complete selected-table columns. UUIDs, identifiers, timestamps, nulls, and JSON/JSONB values are preserved without CSV coercion.

| File | Table | Safe query description | Rows | Bytes | Min → max timestamp | SHA-256 |
| --- | --- | --- | ---: | ---: | --- | --- |
| `rows/device_capabilities.retired.jsonl` | `device_capabilities` | exact three retired UUIDs | 0 | 0 | — | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `rows/device_heartbeats.retired.jsonl` | `device_heartbeats` | exact three retired UUIDs | 21,763 | 47,761,265 | 2026-05-22 17:00:12.357414 → 2026-08-19 22:55:20.664495 | `532255f954f20c4d130f2c2816a90021479b3a762955b109d606847aaa43537d` |
| `rows/device_registry.retired.jsonl` | `device_registry` | exact three retired UUIDs | 3 | 1,140 | 2026-05-22 18:35:39.499879 | `aab79ca94375d3835cdf9577a8b2ca197f0d44a402cfa5c336629b3892aae6ff` |
| `rows/garden_devices.retired.jsonl` | `garden_devices` | exact three retired UUIDs | 3 | 1,039 | 2026-06-07 15:41:30.861079 | `95ec8b664a431dfb6e350ae4a079618e4b01e0e2b6331736a3437c5f20bccaf2` |
| `rows/sensor_events.retired.jsonl` | `sensor_events` | exact three retired UUIDs plus four null-device rows proven by retired aliases | 45 | 59,922 | 2026-05-14 15:52:16 → 2026-06-05 14:49:33.390312 | `b1dafcf4e17c5054f44e28a3be7fd57db060278c0898535ef1f444a427dbe71f` |
| `rows/sensor_logs.retired.jsonl` | `sensor_logs` | exact three retired UUIDs; excludes three unproven `esp32-dev-01` rows | 38,204 | 10,633,827 | 2026-05-06 19:30:11 → 2026-05-29 18:20:12 | `ed83dc424865756ce9ecdc2c982dd8c38c95a1d7115ec77925f3d1887ea2c971` |
| `rows/sensor_measurement_batches.retired.jsonl` | `sensor_measurement_batches` | exact three retired UUIDs | 21,203 | 69,768,134 | 2026-05-29 11:48:44.334403 → 2026-08-19 22:55:15 | `8205de149339e2d38c44fca0ff286fed81259f0dcd2d034d3600f9ac1979c33d` |
| `rows/watering_events.retired.jsonl` | `watering_events` | exact three retired UUIDs | 354 | 174,376 | 2026-06-08 08:54:40 → 2026-08-04 18:13:07 | `00fe1ab852b2624103dfd04675e93d6578b51bb31055ba6e02a358fd84d57896` |

Total proposed retired rows: **81,575**. Balcony02 contributes zero rows to every row file.

## Metadata and verification files

The protected export also contains:

- `metadata/relations.json` — relation kinds, RLS state, ownership, approximate row counts, and sizes;
- `metadata/columns.json` — complete public relation column definitions;
- `metadata/constraints.json` — checks, primary/unique keys, exclusions, and foreign keys;
- `metadata/indexes.json` — all public table index definitions;
- `metadata/policies.json` — all public RLS policy definitions;
- `metadata/grants.json` — relation, sequence, and function grant rows;
- `metadata/views.json` — complete view definitions and view options;
- `metadata/dependencies.json` — view-to-source dependency edges;
- `metadata/functions.json` — public function definitions and security properties;
- `metadata/triggers.json` — public table and event trigger definitions;
- `metadata/extensions.json` — installed extension inventory;
- `metadata/view_exposure.json` — role-specific retired-row exposure checks;
- `metadata/identity_alias_inventory.json` — retired/protected identity matches and alias evidence;
- `metadata/state_before.json` and `metadata/state_after.json` — deterministic non-mutation checks;
- `verification.json` — parsed-count, protected-boundary, credential-scan, and before/after results; and
- `manifest.json` plus `manifest.sha256` — complete file bytes, hashes, filters, counts, and export metadata.

The manifest contains a SHA-256 for every export file. Credential values, secrets, auth tokens, and auth-user rows are absent. The only user-scope observation retained is the non-identifying fact that the sole active garden member and sole active Support member are the same database identity.

## Acceptance result

- database count = written count = parsed count for all eight row files: pass;
- every export file has a SHA-256 recorded in the protected manifest: pass;
- Balcony02 UUID absent from all retired-row files: pass;
- protected/current counts unchanged before and after: pass;
- retired counts and timestamps unchanged before and after: pass;
- relation/policy/view/function/dependency metadata unchanged before and after: pass;
- credential/token value scan: pass;
- ZIP integrity: pass; and
- database mutation performed: none.

See the [Phase 8F.7 inventory and deletion proposal](./phase8f7-retired-device-registry-inventory-and-safety-export.md). Export completion is not authorization to delete.
