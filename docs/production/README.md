# Production Documentation

This folder contains controlled production and service documentation for My Balcony Gardener.

The current Gen2 production wiring artifact is:

- `MBG_Gen2_Pinout_From-To_v1.2_2026-08-04.xlsx`

The authoritative convention effective July 3, 2026 is RED = 3.3V, BLACK = GND, GREEN = GPIO21 / SDA, and WHITE = GPIO22 / SCL. GPIO21 and GPIO22 assignments are unchanged. Factory SEN0562 leads are exceptions, including BLUE = GND and YELLOW = SCL, and do not redefine the MBG internal convention. ADR 0023 is the controlling decision.

That workbook combines the official Gen2 pinout, from-to wiring, current device sensor inventory, BOM cross-reference, future/deferred wiring notes, and install/service validation checklist.

The authoritative Balcony02 physical closeout artifacts are:

- [`MBG_Balcony02_As_Built_and_Commissioning_v1.0_2026-08-12.md`](./MBG_Balcony02_As_Built_and_Commissioning_v1.0_2026-08-12.md)
- [`MBG_Balcony02_As_Built_BOM_v0.1_2026-08-12.xlsx`](./MBG_Balcony02_As_Built_BOM_v0.1_2026-08-12.xlsx) — fillable inventory/pricing record; blank manufacturer, model, serial, supplier, and cost fields do not block commissioning closeout

Phase 7M added the historical proposed Balcony02 build-out wiring logic artifact:

- `MBG_Balcony02_Buildout_Wiring_Plan_v0.2_2026-08-04.md`

The planning artifact remains explicitly `PROPOSED / NOT AS-BUILT / NOT IMPLEMENTED` as historical evidence and is superseded for implementation and service use by the August 12, 2026 as-built commissioning record. Its original planning claims are intentionally preserved.

The old support-folder BOM and From-To workbooks are historical references only. Current repo code, profile definitions, architecture docs, current-state docs, and ADRs are authoritative for current Gen2 pins, profiles, device identities, and control boundaries.

This documentation artifact does not change firmware, SQL, frontend behavior, hosted behavior, local runtime behavior, pin assignments, sensor assignments, watering behavior, or control eligibility.

Future as-built wiring changes should update the production workbook through normal branch, review, and commit discipline. The `.xlsx` workbook is tracked as a controlled production document even though Git cannot show useful cell-level diffs for it.
