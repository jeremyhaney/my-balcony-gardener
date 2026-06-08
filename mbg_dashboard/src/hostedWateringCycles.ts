import type { HostedWateringEventRow } from './api'

export type HostedWateringCycle = {
  id: string
  startAt: string
  startTimestampMs: number
  completedAt: string
  completedTimestampMs: number
  durationSeconds: number
  displayReason: string
  markerLabel: string
}

export const getHostedWateringCycles = (
  rows: HostedWateringEventRow[],
): HostedWateringCycle[] =>
  rows
    .filter((row) => row.event_type === 'watering_completed')
    .map(mapCompletedEventToCycle)
    .filter((cycle): cycle is HostedWateringCycle => Boolean(cycle))
    .sort(
      (left, right) =>
        right.completedTimestampMs - left.completedTimestampMs,
    )

export const formatWateringCycleMarkerLabel = (cycle: HostedWateringCycle): string =>
  cycle.markerLabel

const mapCompletedEventToCycle = (
  row: HostedWateringEventRow,
): HostedWateringCycle | null => {
  if (row.duration_seconds === null || !Number.isFinite(row.duration_seconds)) {
    return null
  }

  const completedTimestampMs = new Date(row.event_at).getTime()

  if (!Number.isFinite(completedTimestampMs)) {
    return null
  }

  const durationSeconds = Math.max(0, Math.round(row.duration_seconds))
  const startTimestampMs = completedTimestampMs - durationSeconds * 1000
  const displayReason = getWateringDisplayReason(row)

  return {
    id: row.id,
    startAt: new Date(startTimestampMs).toISOString(),
    startTimestampMs,
    completedAt: row.event_at,
    completedTimestampMs,
    durationSeconds,
    displayReason,
    markerLabel: `${displayReason} - ${formatCompactDuration(durationSeconds)}`,
  }
}

const getWateringDisplayReason = (row: HostedWateringEventRow): string =>
  row.reason ? formatReason(row.reason, row.trigger_source) : formatTriggerSource(row.trigger_source)

const formatTriggerSource = (value: HostedWateringEventRow['trigger_source']): string => {
  switch (value) {
    case 'manual_local':
      return 'Manual Watering'
    case 'automatic':
      return 'Automatic Watering'
    case 'physical_button':
      return 'Button Watering'
    case 'firmware_safety':
      return 'Device Safety'
  }
}

const formatReason = (
  value: string,
  triggerSource: HostedWateringEventRow['trigger_source'],
): string => {
  switch (value) {
    case 'manual_water_now_started':
    case 'manual_water_now_completed':
      return 'Manual Watering'
    case 'automatic_watering_started':
    case 'automatic_watering_completed':
      return 'Automatic Watering'
    case 'watering_completed_trigger_source_fallback':
      return 'Device Safety'
    default:
      return formatTriggerSource(triggerSource)
  }
}

const formatCompactDuration = (value: number): string => `${value.toLocaleString()}s`
