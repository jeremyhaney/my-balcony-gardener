# ADR 0002: History Restoration Boundary

- Status: Accepted
- Date: 2026-03-27

## Context

The current approved working baseline is the local ESP32 fallback path for live sensor values and Manual Water Now.

The frontend layout already has a minimal structure that can support a careful restoration slice:

- [`mbg_dashboard/src/components/LiveStats.tsx`](../../mbg_dashboard/src/components/LiveStats.tsx) is the active local live surface
- [`mbg_dashboard/src/components/DualAxisChart.tsx`](../../mbg_dashboard/src/components/DualAxisChart.tsx) is a presentation component
- [`mbg_dashboard/src/components/SensorLogViewer.tsx`](../../mbg_dashboard/src/components/SensorLogViewer.tsx) is a separate log/history-oriented component
- [`mbg_dashboard/src/types/sensorLog.ts`](../../mbg_dashboard/src/types/sensorLog.ts) holds the shared sensor log contract

Supabase-backed history and graph behavior are still deferred. The next implementation slice needs a stable boundary that restores history/graph functionality without disturbing the local live path that is already working.

## Decision

The first restoration slice must follow this boundary:

- The local live data path remains separate from the deferred history/graph data path.
- The local live data path continues to own:
  - current sensor value display
  - local ESP32 fallback reads
  - Manual Water Now behavior
- The deferred history/graph path may restore Supabase usage only as a read-only source in the first pass.
- The shared sensor log contract remains centralized and reused rather than duplicated.
- The first restoration slice must not introduce a broad refactor, package extraction, or architecture reshuffle.

## Consequences

- Live local behavior can be validated independently from deferred history restoration.
- History/graph restoration should be implemented as an additive read-only path, not a replacement for the approved local baseline.
- The shared sensor log contract remains the stable boundary between live and history concerns.
- Any future change that merges the live and history data paths, changes the contract boundary, or reintroduces a different primary runtime path requires another ADR.
