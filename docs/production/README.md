# Production Documentation

This folder contains controlled production and service documentation for My Balcony Gardener.

The current Gen2 production wiring artifact is:

- `MBG_Gen2_Pinout_From-To_v1.1_2026-06-02.xlsx`

That workbook combines the official Gen2 pinout, from-to wiring, current device sensor inventory, BOM cross-reference, future/deferred wiring notes, and install/service validation checklist.

Phase 7M adds a proposed Balcony02 build-out wiring logic artifact:

- `MBG_Balcony02_Buildout_Wiring_Plan_v0.1_2026-06-04.md`

The Balcony02 artifact is explicitly `PROPOSED / NOT AS-BUILT / NOT IMPLEMENTED`. It is a planning document for sensor topology, ADC/I2C expansion, connectors, enclosure penetrations, power distribution, physical placement, and serviceability. It does not modify the current Gen2 production wiring workbook and does not approve physical installation.

The old support-folder BOM and From-To workbooks are historical references only. Current repo code, profile definitions, architecture docs, current-state docs, and ADRs are authoritative for current Gen2 pins, profiles, device identities, and control boundaries.

This documentation artifact does not change firmware, SQL, frontend behavior, hosted behavior, local runtime behavior, pin assignments, sensor assignments, watering behavior, or control eligibility.

Future as-built wiring changes should update the production workbook through normal branch, review, and commit discipline. The `.xlsx` workbook is tracked as a controlled production document even though Git cannot show useful cell-level diffs for it.
