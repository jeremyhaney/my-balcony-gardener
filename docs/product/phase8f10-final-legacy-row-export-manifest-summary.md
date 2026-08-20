# Phase 8F.10 Final Legacy Row Export Manifest Summary

Date: 2026-08-20

Status: Verified read-only protected export. Raw production rows and full metadata remain outside Git.

Protected directory:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f10_final_legacy_rows_20260820T184221Z`

Protected ZIP:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f10_final_legacy_rows_20260820T184221Z.zip`

- Manifest SHA-256: `7b60f175502b9890286f8a6794471c7da46c43eabf2d9d4d77cc7c3b0fc65ee5`
- ZIP SHA-256: `1b74dfd19ec0a6719e7998ca8486b7e4756118a57f08c6257be38475642119b0`
- ZIP bytes: `7,461`
- ZIP integrity: pass
- Database rows = written rows = parsed rows: `6 = 6 = 6`
- Database transaction: repeatable read, read only
- Credentials/tokens in payload: none
- Complete public-schema metadata fingerprint before/after: `9d0400c2c4b73b42cdc932584cd45cba8a860cbbd768aa214d5ba4961c1b13a2`, unchanged

| Protected file | Rows | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `rows/sensor_logs.legacy.jsonl` | 3 | 785 | `76d1b3774e9d8d40be5fa343db292cfa66fb53a97457e571fb630a261c0030e3` |
| `rows/sensor_events.legacy.jsonl` | 3 | 1,537 | `0d2dc274af8aa62e257c8cd23ea3a99ed546196ace67720c817ba131781af93d` |
| `metadata/schema_access_dependencies.json` | — | 43,032 | `613a1ba8f521ee25ca5f8a3c94548e6267c4c9c067a245325f05602279091c58` |
| `metadata/protected_balcony02_boundary.json` | — | 1,334 | `0fa2b7ddff4d102931630e988f4c341544e0307a04ebfeb2095cbda1de0d41ec` |
| `metadata/target_state_before.json` | — | 399 | `d7322fc6018029a8246fbee2f2f3f1ce4752fefc8b96d377f9e2e32377011a9c` |
| `metadata/target_state_after.json` | — | 399 | `d7322fc6018029a8246fbee2f2f3f1ce4752fefc8b96d377f9e2e32377011a9c` |
| `metadata/structural_fingerprints.json` | — | 183 | `74870b39582d334e754ce43cac8c829768e2ed7a33f8d85c30bdc5c430a90d29` |

Independent post-discovery receipt:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f10_post_discovery_verification_20260820T184337Z.json`

SHA-256: `095cb4dde9adddf6b6c2e9dec4d09c6cf53feb5c879a8db3898e2deae51e26bc`.

It reproduced both row hashes, both row counts/ranges, the complete structural fingerprint, zero Balcony02 legacy-table rows, and all 95 protected `reservoir_liquid_state` batches. No database write occurred.
