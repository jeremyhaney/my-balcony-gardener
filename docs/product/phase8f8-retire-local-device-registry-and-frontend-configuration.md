# Phase 8F.8 — Retire Local Device Registry and Frontend Configuration

Date: 2026-08-20

Status: Implemented and locally validated. This slice changes frontend source and current-state documentation only. It performs no database mutation, firmware change, deployment, firmware upload, or physical-device request.

## Outcome

The executable frontend registry now contains only the supported Balcony02 identity:

| Field | Value |
| --- | --- |
| device key | `balcony02` |
| label / hosted label | `Balcony02` |
| UUID | `7e5bd328-ad68-4389-a71a-fa5cd01b3813` |
| role | `controller` |
| Demo mapping | sole device and primary device |

Balcony01, Scout01, and Prototype01/Bench01 registry entries, aliases, UUIDs, and retired local roles are absent from executable frontend source. A deterministic test protects both the exact Balcony02 registry object and its public Demo mapping.

Customer and Support device options remain sourced from their protected hosted garden-device views. Their runtime keys and roles are intentionally typed as database-derived strings rather than local-registry identities. Consequently, the unchanged live database may continue exposing the retired devices on Customer and Support routes until the later explicitly approved database-deletion slice.

## Baseline and Phase 8F.7 boundary

The clean pre-change baseline was:

- repository: `C:\AIProjects\projects\my-balcony-gardener`;
- branch: `main`;
- `HEAD`, local `main`, and `origin/main`: `2e89ca0b1b9a9d8a47c5e628f941d021354d8a31`;
- staged and unstaged changes: none; and
- repository `AGENTS.md`: absent.

The Phase 8F.7 live inventory, protected export manifest, dependency-ordered deletion proposal, and proof limits were read before implementation. The verified export contains 81,575 proposed retired rows and zero Balcony02 rows. The three unproven `esp32-dev-01` rows, three unproven `mbg_esp32_001` rows, and Balcony02 `reservoir_liquid_state` evidence remain outside every retirement predicate.

The protected Phase 8F.7 artifacts were re-hashed after implementation without modification:

- manifest SHA-256: `878ecb7e3b5c7e6bf3af325e5867919e7822708cf898d84e16c094cb1a8b83dc`; and
- ZIP SHA-256: `8e7ddb7d66ab3f0145a8da0d12720d8d9336703af1824c5527041b7011dfb71d`.

No database connection, SQL statement, schema command, or write-capable Supabase tool was used in this slice.

## Ownership and reachability proof

Repository search established these ownership boundaries before deletion:

- the local registry supplies only the fixed public Demo device option and landing-page snapshot;
- authenticated Customer and Support options come from `customer_garden_devices` and `support_garden_devices`, then continue through the existing protected measurement, diagnostics, watering, and Support capability views;
- every supported call to measurement, diagnostics, and watering fetch helpers supplies an explicit selected device ID, so `VITE_MBG_DEVICE_ID` and its fallback helper have no supported consumer;
- `getDeviceById` has no caller;
- `VITE_MBG_DASHBOARD_MODE` no longer controls any application branch;
- the Vite `/logs`, `/water-now`, `/status`, `/capabilities`, and `/measurements` proxies have no supported frontend consumer; and
- `VITE_WATER_ENDPOINT`, `VITE_ESP32_URL`, and the hardcoded local ESP32 fallback exist only to configure those unreachable proxies.

The shared history-window functions remain because all hosted routes still consume them. The registry-to-history mapping helper also remains because the Demo uses it for the Balcony02-only option. Database-derived Customer/Support options remain independent of the narrowed local `DeviceKey` type.

## Implementation

- Narrowed `DeviceKey` to `balcony02`, `DeviceRole` to `controller`, and the local registry to one readonly Balcony02 entry.
- Removed retired registry entries, UUIDs, labels, aliases, roles, descriptions, and the unused reverse lookup helper.
- Replaced the stale hosted-site fallback label with `Balcony02`.
- Removed the configured-device environment fallback from history selection and hosted query helpers; valid URL selection still wins, otherwise the first scoped Demo or authorized option is selected.
- Kept Customer/Support device keys flexible because those routes are authorization-derived from the live database rather than the source registry.
- Removed all five browser-to-device Vite proxies, local endpoint resolution, `loadEnv`, and the hardcoded local IP.
- Reduced `.env.local.example` to the two current browser configuration inputs: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Updated current test fixtures to Balcony02-neutral/current identities and added the focused registry/Demo invariant test.
- Updated current-state and roadmap authority while preserving ADRs, completed phase records, SQL evidence, and other accurate historical device references.

## Validation and bundle evidence

Pre-change frontend validation passed 59/59 tests and ESLint. Ordinary and hosted-readonly builds were byte-identical and emitted:

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `index-DFGupKnI.js` | 816,616 | `d113f1d360c4ed4e1b72689ddb00ef19c5cca5fcb07e07910f37f13f20dea568` |
| `browser-B0azeLnE.js` | 340 | `3259bd050695ef580eeac5dd0a1e79602782c390755340ed5a5b3d4d8992a5c0` |
| `index-DwqZiYrA.css` | 47,420 | `7129f93a9419e53f5b66ff51b1840c4cfb297f9237e40a127de49282a9300169` |

Post-change validation passed 60/60 tests, including the new invariant, and ESLint. Ordinary and hosted-readonly builds remained byte-identical and emitted:

| Asset | Bytes | SHA-256 | Change from baseline |
| --- | ---: | --- | --- |
| `index-C1H9-QJh.js` | 815,960 | `59bcd4c23722edef78ece1b495795b48420abf4377d4f0a701709a50f8de9ffb` | 656 bytes smaller; retired registry/configuration code removed |
| `browser-CaKxVnrx.js` | 340 | `e5d9d77c7348a684f5a3c192faa352fc44c60a58f6f7ac0e61f91aaf026b4960` | same bytes; hash/name changed only because its import references the renamed main chunk |
| `index-DwqZiYrA.css` | 47,420 | `7129f93a9419e53f5b66ff51b1840c4cfb297f9237e40a127de49282a9300169` | byte/hash identical |
| `index.html` | 466 | `0a31e0df5747b5f19746d2e6070abf0c96e95b5dc97b665e142ca11a798f9a46` | references the new main chunk |

Hosted forbidden-string guards found no retired UUID, retired source identity/alias, obsolete frontend variable, local IP, `/logs`, `/water-now`, `LiveStats`, or local-watering text. Positive bundle guards retained Balcony02's UUID/key and the public, Customer, and Support measurement/diagnostics/garden-device/watering/capability view names.

Source/test/configuration guards found no retired UUID, retired registry key/role/alias, obsolete frontend variable, local IP, proxy, `/logs`, or `/water-now` in the frontend. The only non-document executable/configuration match elsewhere is the unchanged firmware contract validator, which contains retired route strings solely to assert that firmware source omits them. Existing historical Markdown, SQL, and CHANGELOG evidence was not mechanically rewritten.

The unchanged firmware boundary was validated in proportion to scope:

- `balcony02-gen2` PlatformIO build: pass, 48,580 bytes RAM and 1,035,753 bytes flash;
- safe firmware Supabase configuration guard: pass;
- static Balcony02 endpoint/profile/configuration contract guard: pass; and
- live endpoint validation: intentionally skipped because this slice authorizes no physical-device requests.

Credential-marker scans and `git diff --check` passed.

## Preserved behavior and exact proof limits

This local validation proves source/configuration retirement, deterministic Balcony02 registry/Demo identity, unchanged hosted query contract strings, equal ordinary/hosted generated artifacts, passing automated frontend validation, and an unchanged buildable Balcony02 firmware/configuration contract.

It does not prove a Cloudflare deployment, byte-for-byte correspondence with a served production bundle, authenticated production-route behavior, a new live database snapshot, customer-only isolation independent of the overlapping Customer/Support account, physical firmware behavior, sensor accuracy, watering behavior, or deletion of any database row.

The live database remains exactly outside this slice. Retired registry records remain active, insert-enabled, heartbeat-enabled, and hosted-visible according to the Phase 8F.7 snapshot. Customer may continue showing Balcony01 and Scout01, and Support may continue showing Balcony01, Scout01, and Prototype01/Bench01, until the dependency-ordered deletion is separately approved and executed. Local-source cleanup must not be described as database retirement.

Before any destructive Phase 8F slice, refresh or reconfirm the export, hashes, counts, timestamps, current view exposure, protected Balcony02 counts, nine capability rows, assignment, and the 95 protected `reservoir_liquid_state` batches. Stop if counts changed, if Balcony02 appears in any retired predicate, or if either unproven identifier is silently added. Then obtain explicit approval for the exact destructive transaction. Phase 8F.8 provides no such authorization.
