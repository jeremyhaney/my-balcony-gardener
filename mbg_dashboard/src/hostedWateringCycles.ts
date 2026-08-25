import type { HostedWateringEventRow } from './api'

export type HostedWateringEventTone =
  | 'automatic'
  | 'button'
  | 'device-safety'
  | 'manual'
  | 'reservoir-safety'
  | 'timeout-safety'

export type HostedWateringCycle = {
  id: string
  startEventId: string | null
  startAt: string
  startTimestampMs: number
  startTimeSource: 'event' | 'reconstructed'
  endedAt: string
  endedTimestampMs: number
  terminalEventType: 'watering_completed' | 'watering_safety_cutoff'
  durationSeconds: number
  displayReason: string
  markerLabel: string
  markerColor: string
  tone: HostedWateringEventTone
}

export const getHostedWateringCycles = (
  rows: HostedWateringEventRow[],
): HostedWateringCycle[] => {
  const pendingStartsByDevice = new Map<string, TimedWateringEvent>()
  const cycles: HostedWateringCycle[] = []

  for (const event of sortWateringEvents(rows)) {
    if (event.row.event_type === 'watering_started') {
      pendingStartsByDevice.set(event.row.device_id, event)
      continue
    }

    if (!isTerminalEvent(event)) {
      continue
    }

    const durationSeconds = getDurationSeconds(event.row)

    if (durationSeconds === null) {
      continue
    }

    const pendingStart = pendingStartsByDevice.get(event.row.device_id)
    const pairedStart = isPlausibleStart(pendingStart, event, durationSeconds)
      ? pendingStart
      : null

    if (pendingStart) {
      pendingStartsByDevice.delete(event.row.device_id)
    }

    cycles.push(mapTerminalEventToCycle(event, durationSeconds, pairedStart))
  }

  return cycles.sort(
    (left, right) => right.endedTimestampMs - left.endedTimestampMs,
  )
}

export const formatWateringCycleMarkerLabel = (cycle: HostedWateringCycle): string =>
  cycle.markerLabel

export const formatWateringCycleDuration = (durationSeconds: number): string => {
  if (durationSeconds === 0) {
    return 'Under 1 second'
  }

  return durationSeconds === 1 ? '1 second' : `${durationSeconds.toLocaleString()} seconds`
}

type TimedWateringEvent = {
  row: HostedWateringEventRow
  timestampMs: number
  createdTimestampMs: number
}

type TimedTerminalWateringEvent = TimedWateringEvent & {
  row: HostedWateringEventRow & {
    event_type: 'watering_completed' | 'watering_safety_cutoff'
  }
}

type WateringPresentation = {
  displayReason: string
  markerColor: string
  tone: HostedWateringEventTone
}

const sortWateringEvents = (rows: HostedWateringEventRow[]): TimedWateringEvent[] =>
  rows
    .map(toTimedWateringEvent)
    .filter((event): event is TimedWateringEvent => Boolean(event))
    .sort((left, right) => {
      const eventTimeDifference = left.timestampMs - right.timestampMs

      if (eventTimeDifference !== 0) {
        return eventTimeDifference
      }

      const createdTimeDifference = left.createdTimestampMs - right.createdTimestampMs

      if (createdTimeDifference !== 0) {
        return createdTimeDifference
      }

      const typeDifference = getEventSortOrder(left.row) - getEventSortOrder(right.row)

      return typeDifference !== 0 ? typeDifference : left.row.id.localeCompare(right.row.id)
    })

const toTimedWateringEvent = (
  row: HostedWateringEventRow,
): TimedWateringEvent | null => {
  const timestampMs = new Date(row.event_at).getTime()

  if (!Number.isFinite(timestampMs)) {
    return null
  }

  const createdTimestampMs = row.created_at
    ? new Date(row.created_at).getTime()
    : Number.NaN

  return {
    row,
    timestampMs,
    createdTimestampMs: Number.isFinite(createdTimestampMs)
      ? createdTimestampMs
      : timestampMs,
  }
}

const getEventSortOrder = (row: HostedWateringEventRow): number =>
  row.event_type === 'watering_started' ? 0 : 1

const isTerminalEvent = (
  event: TimedWateringEvent,
): event is TimedTerminalWateringEvent =>
  event.row.event_type === 'watering_completed' ||
  event.row.event_type === 'watering_safety_cutoff'

const getDurationSeconds = (row: HostedWateringEventRow): number | null => {
  if (row.duration_seconds === null || !Number.isFinite(row.duration_seconds)) {
    return null
  }

  return Math.max(0, Math.round(row.duration_seconds))
}

const isPlausibleStart = (
  start: TimedWateringEvent | undefined,
  terminal: TimedWateringEvent,
  durationSeconds: number,
): start is TimedWateringEvent => {
  if (!start || start.timestampMs > terminal.timestampMs) {
    return false
  }

  return terminal.timestampMs - start.timestampMs <= (durationSeconds + 2) * 1000
}

const mapTerminalEventToCycle = (
  terminal: TimedTerminalWateringEvent,
  durationSeconds: number,
  start: TimedWateringEvent | null,
): HostedWateringCycle => {
  const startTimestampMs = start
    ? start.timestampMs
    : terminal.timestampMs - durationSeconds * 1000
  const presentation = getWateringPresentation(terminal.row)

  return {
    id: terminal.row.id,
    startEventId: start?.row.id ?? null,
    startAt: new Date(startTimestampMs).toISOString(),
    startTimestampMs,
    startTimeSource: start ? 'event' : 'reconstructed',
    endedAt: terminal.row.event_at,
    endedTimestampMs: terminal.timestampMs,
    terminalEventType: terminal.row.event_type,
    durationSeconds,
    displayReason: presentation.displayReason,
    markerLabel: `${presentation.displayReason} · ${formatCompactDuration(durationSeconds)}`,
    markerColor: presentation.markerColor,
    tone: presentation.tone,
  }
}

const getWateringPresentation = (
  row: HostedWateringEventRow,
): WateringPresentation => {
  if (row.event_type === 'watering_safety_cutoff') {
    switch (row.reason) {
      case 'physical_button_hold_timeout':
        return {
          displayReason: 'Button Safety Cutoff',
          markerColor: '#a16207',
          tone: 'timeout-safety',
        }
      case 'reservoir_liquid_lost':
        return {
          displayReason: 'Reservoir Safety Stop',
          markerColor: '#be123c',
          tone: 'reservoir-safety',
        }
      default:
        return {
          displayReason: 'Device Safety Stop',
          markerColor: '#475569',
          tone: 'device-safety',
        }
    }
  }

  if (row.reason === 'physical_button_program_completed') {
    return {
      displayReason: 'Button Cycle',
      markerColor: '#1d4ed8',
      tone: 'button',
    }
  }

  if (row.reason === 'physical_button_cancelled') {
    return {
      displayReason: 'Button Stop',
      markerColor: '#1d4ed8',
      tone: 'button',
    }
  }

  const displayReason = row.reason
    ? formatReason(row.reason, row.trigger_source)
    : formatTriggerSource(row.trigger_source)

  switch (row.trigger_source) {
    case 'automatic':
      return { displayReason, markerColor: '#15803d', tone: 'automatic' }
    case 'manual_local':
      return { displayReason, markerColor: '#7e22ce', tone: 'manual' }
    case 'physical_button':
      return { displayReason, markerColor: '#1d4ed8', tone: 'button' }
    case 'firmware_safety':
      return { displayReason, markerColor: '#475569', tone: 'device-safety' }
  }
}

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

const formatCompactDuration = (value: number): string =>
  value === 0 ? '<1s' : `${value.toLocaleString()}s`
