# Phase 8C Hosted Device-Capability Production Execution Evidence

Status: production schema and Balcony02 provisioning executed and validated

Execution date: 2026-08-14

Authority: ADR 0024

## Executed sources

Jeremy manually installed `btree_gist` version `1.7` and executed in the Supabase SQL Editor the exact committed statement bodies from:

- [`../sql/phase8c-hosted-device-capability-contract-proposal.sql`](../sql/phase8c-hosted-device-capability-contract-proposal.sql)
- [`../sql/phase8c-balcony02-capability-provisioning-proposal.sql`](../sql/phase8c-balcony02-capability-provisioning-proposal.sql)

Those files were committed at `8335b68988a84683d48a25c5d1173aa9efb7f6e2` (`Design hosted device capability contract`). Their `PROPOSAL ONLY — NOT EXECUTED` headers record their pre-execution review origin. The headers and executed statement bodies remain unchanged so the committed files continue to be exact execution-source evidence; this closeout records their subsequent production execution.

The installed extension exposed the `public.gist_text_ops` text GiST operator class. The extension supports the table's exclusion constraint; it grants no browser or command authority.

## Production objects and access validation

Production now contains `public.device_capabilities`, `public.customer_device_capabilities`, and `public.support_device_capabilities`. Validation confirmed:

- both views have `security_barrier=true`;
- base-table RLS is enabled, forced RLS is false, and the base table has zero policies;
- the primary key, device/key/start unique constraint, and GiST no-overlap exclusion constraint are present;
- four table indexes exist: primary key, unique device/key/start, GiST exclusion, and partial current-device indexes;
- `anon` has no SELECT on the base table or either protected view;
- `authenticated` has no SELECT on the base table and has SELECT on both protected views; and
- no capability browser writes, public Demo capability view, watering authority, or command/control path exists.

The customer view depends on `device_capabilities` and `customer_garden_devices` and returns current authorized declarations only. The Support view depends on `device_capabilities` and `support_garden_devices` and returns authorized lifecycle history.

## Balcony02 provisioning

Balcony02 (`7e5bd328-ad68-4389-a71a-fa5cd01b3813`, device key `balcony02`) was provisioned with exactly nine positive commissioned logical-sensor rows and eleven expected stored measurement names. Every row uses the Jeremy-accepted administrative commissioning-effective instant `2026-08-12T17:03:41Z`; every `effective_to` is null. This instant was deliberately selected and was not inferred from telemetry.

| Logical sensor | Channel | Family | Expected measurements | Physical ID | Friendly name | Location |
| --- | --- | --- | --- | --- | --- | --- |
| `bme280_air` | `AIR` | `BME280` | `air_temperature`, `relative_humidity`, `barometric_pressure` | — | Balcony Air Conditions | Near controller, house side |
| `ds18b20_temperature` | `ST` | `DS18B20` | `soil temp` | `ST04` | Basket 3 Soil Temperature | Basket 3 |
| `sen0204_wl01` | `WL01` | `SEN0204` | `reservoir_liquid_detected` | — | Reservoir Water Available | Reservoir |
| `sen0308_m01` | `M01` | `SEN0308` | `raw_adc` | `M1` | Basket 1 Soil Moisture | Basket 1 |
| `sen0308_m02` | `M02` | `SEN0308` | `raw_adc` | `M4` | Basket 3 Soil Moisture | Basket 3 |
| `sen0308_m03` | `M03` | `SEN0308` | `raw_adc` | `M3` | Basket 6 Soil Moisture | Basket 6 |
| `sen0562_l01` | `L01` | `SEN0562` | `ambient_light` | `L02` | Basket 1 Sunlight | Basket 1 |
| `sen0562_l02` | `L02` | `SEN0562` | `ambient_light` | `L03` | Basket 3 Sunlight | Basket 3 |
| `sen0562_l03` | `L03` | `SEN0562` | `ambient_light` | `L01` | Basket 6 Sunlight | Basket 6 |

There are zero prohibited rows: `sen0308_m04`, `sen0562_l04`, and `lux04` are absent. Prototype01, Balcony01, and Scout01 were not provisioned. M04 connector accommodation remains a non-commissioning fact.

Balcony02 remains assigned exactly once to the one active `jeremy-balcony-pilot` garden as `support_bench`, with `support_visible=true` and `customer_visible=false`. This closeout did not change that assignment.

## Authorization proof

Rollback-only authenticated-role validation succeeded:

- the Support identity returned all nine Balcony02 lifecycle rows with the correct device key and lifecycle values;
- the customer identity returned zero Balcony02 rows, as required by `customer_visible=false`; and
- an unauthorized synthetic identity returned zero customer rows and zero Support rows.

Every authorization-validation transaction ended with `ROLLBACK`.

## Preserved boundaries and deferred work

Supabase positive commissioned declarations are now the hosted provisioning authority. Presence means the hosted frontend may expect a logical sensor; absence makes no negative assertion. Measurements and firmware `/capabilities` neither provision nor reconcile the database. Missing, stale, invalid, unavailable, or never-reported measurements cannot remove a commissioned declaration.

Customer and Support authorization remain separate. No frontend consumes these views yet. Support expected-measurement status, undeclared-measurement, and firmware/provisioning mismatch diagnostics remain deferred pending bounded-query design and production read-only `EXPLAIN`. No build-profile fallback, public Demo capability view, hosted watering path, or command authority was introduced. Firmware watering authority and safety behavior are unchanged.

This documentation closeout executed no SQL, changed no Supabase object or row, changed no assignment or capability, modified no frontend or firmware, and performed no deployment.
