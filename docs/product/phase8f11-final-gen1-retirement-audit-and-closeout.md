# Phase 8F.11 — Final Gen1 Retirement Audit and Closeout

Date: 2026-08-20

Status: Complete. Repository-wide audit and documentation reconciliation passed; Phase 8F is operationally closed. Phase 8G Watering-Threshold Presentation is next and remains unimplemented.

## Outcome

The complete tracked repository was audited from clean synchronized `main` at Phase 8F.10 commit `4ba89bf663ed310db8c07e1e037410e9c516c93b`. No executable Gen1 path, browser-to-device frontend path, obsolete selectable firmware profile, active retired source identity, legacy firmware URL-shape dependency, current `sensor_logs` consumer/writer, or unresolved schema/access retirement proposal remains.

Phase 8F is operationally closed. Remaining Gen1, Balcony01, Scout01, Prototype01/Bench01, `sensor_logs`, retired endpoint/profile/identity, legacy URL-shape, and retired frontend-path terms are retained only where they accurately preserve history, recovery/execution evidence, the explanation of a retired boundary, or a negative guard protecting the current Gen2 boundary.

No SQL or database action, live database access, firmware/frontend runtime change, private configuration edit, deployment, upload, serial action, physical watering action, Cloudflare action, or Supabase administration occurred in Phase 8F.11.

## Baseline and authority reviewed

The refreshed remote baseline established:

- branch `main`;
- clean tracked and untracked state;
- local `HEAD` and `origin/main` both at `4ba89bf663ed310db8c07e1e037410e9c516c93b`;
- Phase 8F.10 baseline commit is the current ancestor/equality point; and
- no repository `AGENTS.md` exists.

The audit read the complete Phase 8F.1–8F.10 evidence chain, including the Phase 8F.7/8F.10 protected-export manifest summaries and the Phase 8F.9/8F.10 execution records. It also reviewed:

- [`ARCHITECTURE.md`](../ARCHITECTURE.md);
- [`CURRENT_STATE.md`](../CURRENT_STATE.md);
- [`PHASE_BACKLOG.md`](../PHASE_BACKLOG.md);
- the [approved Phase 8 sequence](./phase8-post-8c5-priority-sequence.md);
- [`ADR_ACTIVE_DECISION_DIGEST.md`](../ADR_ACTIVE_DECISION_DIGEST.md);
- [`ADR_SOURCE_PACK_INDEX.md`](../ADR_SOURCE_PACK_INDEX.md);
- [`SQL_SCHEMA_ACTIVE_DIGEST.md`](../SQL_SCHEMA_ACTIVE_DIGEST.md);
- the raw ADR set and historical schema snapshot where the retirement terms occur; and
- all tracked executable/configuration, SQL, phase, field-test, incident, production, and root documentation matches.

Current official Supabase guidance was checked for the audit language. Grants still determine whether Data API roles can reach an object, while RLS separately determines accessible rows; both boundaries matter. The current breaking-change index does not invalidate the Phase 8F.10 recorded catalog/access result. Phase 8F.11 makes no new live-state claim beyond the independently verified Phase 8F.10 evidence.

## Complete Phase 8F sequence

| Slice | Retirement result |
| --- | --- |
| 8F.1 | Removed the unsupported Prototype01 `LiveMeasurements` frontend and its polling/types/helpers. |
| 8F.2 | Removed `LiveStats`, browser `/logs` polling, browser identity gating, local Water Now, and local-control target definitions. |
| 8F.3 | Removed the non-hosted route and all supported frontend `sensor_logs` history/query/chart/health paths. |
| 8F.4 | Removed retired Balcony01, Scout01, and Prototype01/Bench01 selectable PlatformIO environments and default selection; `balcony02-gen2` became the sole supported device environment. |
| 8F.5 | Removed unreachable Gen1 firmware source, the legacy writer, `/logs`, HTTP `/water-now`, disabled legacy sensor modules, generic fallbacks, and retired branches while preserving Balcony02 safety and Gen2 contracts. |
| 8F.6 | Migrated ignored firmware configuration to the Supabase project HTTPS root and made builds reject legacy table-suffixed URL shapes without exposing private values. |
| 8F.7 | Inventoried retired live identities/dependencies/exposure and created the first verified protected safety export without mutation. |
| 8F.8 | Removed retired frontend registry identities, obsolete environment fallbacks, and unused browser-to-device Vite proxy/configuration paths. |
| 8F.9 | Refreshed the protected export and deleted exactly 81,575 proven retired-device rows in one assertion-guarded transaction, preserving Balcony02 and six then-unmapped rows. |
| 8F.10 | Proved the final six rows were development/validation fixtures, exported and deleted them, dropped empty obsolete `sensor_logs` with `RESTRICT`, revoked unused API-role privileges from retained empty `sensor_events`, and preserved the shared helper with exactly two current Gen2 dependencies. |
| 8F.11 | Audited every tracked retirement reference, corrected stale current authority, recorded the final supported boundaries and proof limits, and operationally closed Phase 8F. |

## Final supported boundaries

### Frontend

- Ordinary and hosted-readonly builds enter the same hosted Gen2 route shell.
- Public Demo source identity is Balcony02 only.
- Authenticated Customer and Support device choices are authorization-derived from protected garden-device views.
- No supported frontend route calls a local device endpoint, renders Water Now, reads `sensor_logs`, or carries retired local endpoint/proxy configuration.
- Current browser configuration is limited to the Supabase URL and browser-safe anonymous/publishable-key input already established by the project; no private key is introduced by this closeout.

### Firmware and local control

- `balcony02-gen2` is the sole selectable supported device environment.
- Supported local endpoints are exactly `/`, `/status`, `/capabilities`, and `/measurements`.
- Firmware configuration stores the Supabase project HTTPS root; firmware constructs only the current measurement-batch, heartbeat, and watering-event Data API routes.
- Physical-button watering, active-low relay semantics, reservoir start/loss interlocks, maximum-hold cutoff, pump-shutoff ordering, duration/event accounting, and local/offline authority remain unchanged.
- The generic automatic-control threshold/quality/cooldown implementation remains a source-level Gen2 extension boundary. Balcony02 has no direct analog-soil control feed, and this closeout grants no new watering authority.

### Identity and configuration

- Balcony02 is the only current source-registry device, supported firmware profile identity, and protected live registry identity established by the Phase 8F evidence.
- Balcony01, Scout01, and Prototype01/Bench01 identifiers remain only as history/recovery evidence; they must not be reused.
- Future devices require new explicit profiles, stable unique UUIDs, identities, and reviewed configuration rather than a generic fallback or retired identity inheritance.
- The ignored private firmware file remains untracked and unchanged by Phase 8F.11.

### Database and access

- `public.sensor_logs` is absent.
- `public.sensor_events` remains present and empty, with RLS enabled/not forced, zero policies, and no table privileges for `anon`, `authenticated`, or `service_role` at the independently verified Phase 8F.10 boundary.
- `public.is_device_telemetry_insert_enabled(text)` remains unchanged with exactly two current Gen2 policy dependencies: measurement-batch inserts and watering-event inserts.
- Current Gen2 registry, capability, assignment, measurement, heartbeat, watering-event, hosted-view, auth/RLS, and governance surfaces remain protected and unchanged by this documentation slice.
- No executable Phase 8F.10 proposal remains.

## Repository search and reference classification

The tracked-tree search used a combined case-sensitive/case-insensitive retirement vocabulary covering `Gen1`, the four retired friendly identities and aliases, `sensor_logs`, `/logs`, `/water-now`, retired frontend components and environment variables, retired PlatformIO profiles, the historical Data API table suffix, and retired local IP forms. Before adding this closeout record, the combined search returned 1,063 matching lines in 79 tracked files. Every meaningful match falls into the classifications below.

| Classification | Disposition |
| --- | --- |
| Valid historical evidence | Raw ADRs; `CHANGELOG`; chronological portions of `CURRENT_STATE.md`, `PHASE_BACKLOG.md`, and `README.md`; Phase 4–8 product/field/incident/production records; and Phase 8F.1–8F.10 records accurately describe what existed or was proven at their recorded checkpoints. Preserve. |
| Protected recovery/export or executed-SQL evidence | Phase 8F.7/8F.10 manifest summaries, Phase 8F.9/8F.10 execution records, executed exact-hash SQL, prior applied SQL/schema artifacts, receipts/hashes referenced from the support repository, and Git history remain immutable evidence. Preserve. |
| Valid current explanation of a retired boundary | Current architecture, state, roadmap, ADR digest, schema digest, README, and this record explain why retired names may still appear and state that the corresponding live/runtime path is absent. Retain after reconciliation. |
| Retained current Gen2 behavior or extension boundary | The sole non-document executable hit is `scripts/validate-balcony02-gen2-contracts.ps1`; its retired strings are negative assertions requiring supported firmware source to omit them. The generic automatic-control source boundary and current Gen2 helper dependencies are retained behavior, not Gen1 compatibility. |
| Stale or misleading current guidance requiring correction | Corrected in Phase 8F.11: architecture lines that listed removed endpoints/writes or proposed already-executed grants; backlog/roadmap lines that stopped at 8F.8/8F.9; the six-row/schema-disposition language; and root/current guidance that treated Gen1 cleanup or retired registry identities as future/current. |
| Uncertain and requiring a documented decision | None. The earlier six-row uncertainty was resolved in Phase 8F.10, and this tracked-repository audit found no new material uncertainty. |

Historical terminology was not mechanically erased. Its surrounding checkpoint/status language is what makes it valid evidence. Proposal-named executed SQL files retain their original names and bodies; their execution records and current authority state that they were approved and executed.

## Documentation reconciliation

Current authority now consistently states:

- Phase 8F.1–8F.10 are complete;
- the final six development/validation rows are gone;
- `sensor_logs` is absent;
- the Phase 8F.10 schema/access artifact was executed and independently verified;
- retained `sensor_events` has the recorded isolated/no-API-role access boundary;
- Phase 8F is operationally closed by this audit; and
- Phase 8G Watering-Threshold Presentation is next but not authorized or implemented by this record.

No raw ADR, completed phase record, executed SQL, manifest, receipt, hash, protected export, or historical schema snapshot was rewritten to pretend the earlier state never existed.

## Validation

All required local checks passed:

- changed Markdown links: zero broken local targets across the eight changed/new Markdown files;
- current stale-claim search: zero matches for Phase 8F active-through-8F.8/8F.9, unapproved legacy-schema disposition, proposed-but-executed grant retirement, or future Gen1 cleanup language;
- complete tracked retirement vocabulary search: 1,063 matching lines in 79 files before this closeout was added, all classified above;
- non-document executable/configuration retirement search: one match, the intentional negative token list in `scripts/validate-balcony02-gen2-contracts.ps1`; no executable retired path or identity match;
- added sensitive-value scan: zero key assignments, JWTs, credentialed PostgreSQL URLs, service-role values, or concrete Supabase project hosts. One concrete project host already existed in baseline `CURRENT_STATE.md`; it was not on a changed diff line and was not copied into this closeout;
- formatting: changed/new files have no trailing whitespace, end correctly, and `git diff --check` passes;
- frontend tests: 60 of 60 pass;
- frontend lint: pass;
- ordinary TypeScript/Vite production build: pass;
- hosted-readonly TypeScript/Vite production build: pass after the first sandboxed attempt hit the known local `spawn EPERM` restriction and the authorized retry succeeded;
- ordinary and hosted generated asset names/sizes: equal — main JavaScript 815,960 bytes, browser JavaScript 340 bytes, and CSS 47,420 bytes; the unchanged Vite large-chunk advisory remains non-fatal;
- `pio run -e balcony02-gen2`: pass, using 48,580 bytes RAM and 1,035,753 bytes flash;
- safe ignored firmware Supabase configuration guard: pass, reporting only HTTPS/project-host/project-root/key-defined classifications;
- Balcony02 contract/configuration guard: pass for exact supported routes, retired source/module/flag absence, static capabilities, installed measurement order, pump-shutoff ordering, physical-button/reservoir/max-hold safety, generic automatic-control extension boundary, compile-time provisioning, root-only resolver, and exactly three current Gen2 Data API targets;
- live firmware endpoint checks: intentionally skipped because no BaseUrl was supplied and Phase 8F.11 authorizes no physical-device request; and
- changed-path boundary: only the eight Markdown documentation files listed below changed; no executable source, private configuration, SQL, protected export, receipt, manifest, or generated runtime artifact is in the Git change set.

Final post-commit/push synchronization is recorded in the handoff report rather than self-referencing a commit hash inside its own content.

## Protected recovery artifacts and proof limits

The Phase 8F.7, 8F.9, and 8F.10 records identify the protected external JSONL/metadata exports, ZIP files, manifests, receipts, hashes, deletion predicates, catalog fingerprints, and restore order. Phase 8F.11 neither opens nor changes protected row payloads. Those artifacts remain targeted logical recovery evidence, not a substitute for Supabase physical backup/PITR, and restoration remains a separately reviewed and explicitly approved change.

This closeout proves tracked-repository source/configuration absence, documentation consistency, local automated build/guard results, and the continuity of the recorded Phase 8F.10 independently verified database boundary. It does not independently re-query the live database, prove current production traffic or served-bundle byte correspondence, exercise authentication with distinct customer-only and Support identities, prove live firmware endpoint behavior, upload firmware, inspect serial output, validate sensors/electrical relays/pump shutoff on hardware, perform watering, rehearse restoration, or run a Supabase Dashboard advisor. No claim beyond the evidence actually checked is made.

## Closeout decision and handoff

No material unresolved Gen1 risk remains within the approved Phase 8F boundary. Phase 8F is operationally closed.

The next roadmap slice is Phase 8G Watering-Threshold Presentation. It must remain display-only: expose the controller's actual configured threshold and honest units/context without changing the threshold, implying agronomic recommendation, adding hosted command/control, or transferring watering authority from local firmware.
