# Phase 8G.4 MS02 Digital QR Pilot

## Status

The digital QR and its production asset row are complete. Jeremy separately
approved the asset-only transaction, which completed successfully in the main
Production database on 2026-08-27 UTC. Read-only verification found exactly one
matching asset row and zero installation rows. No frontend, firmware, or hosted
command path is part of this pilot.

## Verified identity

Jeremy selected MS02 installed on Prototype02 as the first asset. Repository
authority records it as:

- physical legacy label: `SEN0308-M02`;
- family/model: DFRobot `SEN0308`;
- Prototype02 logical key: `sen0308_m01`;
- connection: ADC01 A0 behind mux channel 0;
- manufacturer serial: unavailable;
- firmware-discoverable hardware UID: unavailable.

The legacy physical label is recorded as provenance only. It is not used as the
new asset identity.

## New asset identity

- Asset UUID: `873bc473-98fc-4b23-beeb-5d80e7bf945a`
- Asset tag: `MBG-SA-000001`
- QR payload:
  `urn:mbg:sensor-asset:873bc473-98fc-4b23-beeb-5d80e7bf945a`
- QR error correction: Q

Generated artifacts:

- PNG:
  `assets/phase8g4-ms02-qr/mbg-sa-000001-873bc473-98fc-4b23-beeb-5d80e7bf945a.png`
- SVG:
  `assets/phase8g4-ms02-qr/mbg-sa-000001-873bc473-98fc-4b23-beeb-5d80e7bf945a.svg`
- machine-readable manifest:
  `assets/phase8g4-ms02-qr/mbg-sa-000001-873bc473-98fc-4b23-beeb-5d80e7bf945a.json`
- PNG SHA-256:
  `ED656FA23D857113A752B1D814BF13080700B75B220C7F9B6B72FD6202761F35`
- SVG SHA-256:
  `19EED4EBCDC4E09636B1FA3CECE564DBD88D6C5913140288BAFC2BD236C5DBB7`

An independent `jsQR` decode of the generated PNG returned the exact canonical
URN. Generation and decode dependencies were installed only in Codex's isolated
visualization runtime; project dependencies and lockfiles were unchanged.

The QR contains no manufacturer, model, logical channel, device, or service
state. Those values may change or be corrected without replacing the stable QR.

## Scope boundary

The executed SQL registers the asset only. P02 is a bench simulation unit, so
Jeremy confirmed that no `sensor_installations` row is inferred or required
for this pilot and no installation verification is pending. MS02's physical
presence on P02 is retained as pilot provenance, not modeled as a production
service interval.

Production verification recorded:

- exact matching asset rows: `1`;
- installation rows for the asset: `0`; and
- database `created_at`: `2026-08-27 03:56:23.910579+00`.

MUX02 is not used for the first pilot. It was discarded after its failure and
is no longer available for physical identity verification or label attachment.

## Deferred Support interface requirements

The later authenticated Support interface must:

- register an asset and allocate or accept its stable UUID/tag;
- generate, download, print, and scan the canonical QR payload;
- look up asset inventory and installation history from a scan;
- distinguish registered/uninstalled assets from currently installed assets;
- permit mutation only to an authorized Support-admin service workflow;
- keep `support_read_only` non-mutating;
- atomically validate same-family replacement topology and cutover evidence;
- never grant browser clients direct writes to the base tables; and
- retain raw historical measurement labels without treating them as asset IDs.

The manual SQL path is a controlled commissioning bridge, not the routine field
service design.
