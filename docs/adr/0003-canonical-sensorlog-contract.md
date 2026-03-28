# ADR 0003: Canonical SensorLog Contract

- Status: Accepted
- Date: 2026-03-28

## Context

The project already uses a shared `SensorLogRow` shape in frontend code, and the same nested payload shape is relied on by firmware-facing reads and Supabase history work.

Without an explicit stable contract in the architecture docs, future frontend, firmware, and Supabase changes could drift in:

- field names
- field types
- nested object shape
- assumptions about `jsonb` storage

The repo needs one locked contract so the current read-only history path and any later coordinated work stay aligned.

## Decision

The canonical contract is locked as:

```ts
type SensorLogRow = {
  id?: string
  device_id: string
  timestamp: string
  data: {
    temperature: number
    humidity: number
    moisture: number
    watering: boolean
    lastWateredTime: string
    lastWateringDuration: number
  }
}
```

The following rules apply:

- the shared definition in `mbg_dashboard/src/types/sensorLog.ts` is authoritative in-repo
- Supabase stores `data` as `jsonb`
- `jsonb` object key order is not significant
- field names and value types are significant
- contract changes require a new ADR plus coordinated frontend, firmware, and database/query updates

## Consequences

- Frontend, firmware, and Supabase history work now have a stable contract boundary.
- Future changes cannot casually rename fields, flatten the shape, or change value types without formal coordination.
- Read-only history restoration and later cross-layer work should validate against this contract first.
- The contract is explicitly locked to prevent drift across frontend, firmware, and Supabase history work.
