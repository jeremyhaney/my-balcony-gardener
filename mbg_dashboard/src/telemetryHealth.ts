import type { HistoryWindowKey } from './historyControls'
import type { SensorLogRow } from './types/sensorLog'

export type TelemetryHealthStatus = 'healthy' | 'warning' | 'no-recent-data' | 'no-data'

export type LatestTelemetryReadings = {
  temperature: number | null
  humidity: number | null
  moisture: number | null
}

export type TelemetryHealth = {
  status: TelemetryHealthStatus
  statusLabel: string
  rowsInWindow: number
  validTimestampRows: number
  expectedRows: number | null
  coveragePercent: number | null
  latestTimestamp: string | null
  latestAgeMs: number | null
  largestGapMs: number | null
  latestReadings: LatestTelemetryReadings | null
  wateringMarkersInHistory: number
  notes: string[]
}

const NORMAL_CADENCE_MINUTES = 15
const FRESHNESS_THRESHOLD_MS = 45 * 60 * 1000
const COVERAGE_WARNING_THRESHOLD_PERCENT = 70
const EXPECTED_ROWS_PER_DAY = (24 * 60) / NORMAL_CADENCE_MINUTES

const EXPECTED_ROWS_BY_WINDOW: Partial<Record<HistoryWindowKey, number>> = {
  '24h': EXPECTED_ROWS_PER_DAY,
  '7d': 7 * EXPECTED_ROWS_PER_DAY,
  '1m': 30 * EXPECTED_ROWS_PER_DAY,
  '3m': 90 * EXPECTED_ROWS_PER_DAY,
  '6m': 180 * EXPECTED_ROWS_PER_DAY,
  '1y': 365 * EXPECTED_ROWS_PER_DAY,
}

const STATUS_LABELS: Record<TelemetryHealthStatus, string> = {
  healthy: 'Device Status',
  warning: 'Device Status',
  'no-recent-data': 'Device Status',
  'no-data': 'Device Status',
}

type TimestampedRow = {
  row: SensorLogRow
  timestampMs: number
}

export const calculateTelemetryHealth = (
  rows: SensorLogRow[],
  historyWindowKey: HistoryWindowKey,
  now: Date = new Date(),
): TelemetryHealth => {
  const rowsInWindow = rows.length
  const expectedRows = EXPECTED_ROWS_BY_WINDOW[historyWindowKey] ?? null
  const wateringMarkersInHistory = rows.filter((row) => row.data.watering === true).length

  if (rowsInWindow === 0) {
    return buildHealth({
      status: 'no-data',
      rowsInWindow,
      expectedRows,
      coveragePercent: expectedRows === null ? null : 0,
      validTimestampRows: 0,
      latestTimestamp: null,
      latestAgeMs: null,
      largestGapMs: null,
      latestReadings: null,
      wateringMarkersInHistory,
      notes: ['No rows were returned for the selected history window.'],
    })
  }

  const rowsWithValidTimestamps = rows
    .map((row): TimestampedRow | null => {
      const timestampMs = new Date(row.timestamp).getTime()
      return Number.isFinite(timestampMs) ? { row, timestampMs } : null
    })
    .filter((row): row is TimestampedRow => row !== null)
    .sort((a, b) => a.timestampMs - b.timestampMs)

  const validTimestampRows = rowsWithValidTimestamps.length
  const coveragePercent =
    expectedRows === null ? null : (validTimestampRows / expectedRows) * 100

  if (validTimestampRows === 0) {
    return buildHealth({
      status: 'warning',
      rowsInWindow,
      expectedRows,
      coveragePercent,
      validTimestampRows,
      latestTimestamp: null,
      latestAgeMs: null,
      largestGapMs: null,
      latestReadings: null,
      wateringMarkersInHistory,
      notes: ['Rows were returned, but none had a valid report time.'],
    })
  }

  const latestRow = rowsWithValidTimestamps[rowsWithValidTimestamps.length - 1]
  const latestAgeMs = now.getTime() - latestRow.timestampMs
  const largestGapMs = getLargestGapMs(rowsWithValidTimestamps)
  const latestReadings = getLatestReadings(latestRow.row)
  const hasImpossibleLatestReading = !areLatestReadingsPlausible(latestReadings)
  const notes: string[] = []

  if (latestAgeMs > FRESHNESS_THRESHOLD_MS) {
    notes.push('The newest row is older than the freshness threshold.')
  }

  if (hasImpossibleLatestReading) {
    notes.push('The newest row has one or more readings outside the expected display range.')
  }

  if (
    coveragePercent !== null &&
    coveragePercent < COVERAGE_WARNING_THRESHOLD_PERCENT
  ) {
    notes.push('The selected window has fewer rows than expected for normal reporting.')
  }

  if (
    largestGapMs !== null &&
    largestGapMs > FRESHNESS_THRESHOLD_MS &&
    (historyWindowKey === '24h' || historyWindowKey === '7d')
  ) {
    notes.push('There is a long gap between reports in this history window.')
  }

  const status = getStatus({
    latestAgeMs,
    hasImpossibleLatestReading,
    coveragePercent,
    largestGapMs,
    historyWindowKey,
  })

  return buildHealth({
    status,
    rowsInWindow,
    expectedRows,
    coveragePercent,
    validTimestampRows,
    latestTimestamp: latestRow.row.timestamp,
    latestAgeMs,
    largestGapMs,
    latestReadings,
    wateringMarkersInHistory,
    notes,
  })
}

const buildHealth = (health: Omit<TelemetryHealth, 'statusLabel'>): TelemetryHealth => ({
  ...health,
  statusLabel: STATUS_LABELS[health.status],
})

const getLargestGapMs = (rowsWithValidTimestamps: TimestampedRow[]): number | null => {
  if (rowsWithValidTimestamps.length < 2) {
    return null
  }

  let largestGapMs = 0

  for (let index = 1; index < rowsWithValidTimestamps.length; index += 1) {
    const gapMs =
      rowsWithValidTimestamps[index].timestampMs -
      rowsWithValidTimestamps[index - 1].timestampMs

    largestGapMs = Math.max(largestGapMs, gapMs)
  }

  return largestGapMs
}

const getLatestReadings = (row: SensorLogRow): LatestTelemetryReadings => ({
  temperature: Number.isFinite(row.data.temperature) ? row.data.temperature : null,
  humidity: Number.isFinite(row.data.humidity) ? row.data.humidity : null,
  moisture: Number.isFinite(row.data.moisture) ? row.data.moisture : null,
})

const areLatestReadingsPlausible = (readings: LatestTelemetryReadings): boolean =>
  readings.temperature !== null &&
  readings.temperature >= -20 &&
  readings.temperature <= 140 &&
  readings.humidity !== null &&
  readings.humidity >= 0 &&
  readings.humidity <= 100 &&
  readings.moisture !== null &&
  readings.moisture >= 0 &&
  readings.moisture <= 100

const getStatus = ({
  latestAgeMs,
  hasImpossibleLatestReading,
  coveragePercent,
  largestGapMs,
  historyWindowKey,
}: {
  latestAgeMs: number
  hasImpossibleLatestReading: boolean
  coveragePercent: number | null
  largestGapMs: number | null
  historyWindowKey: HistoryWindowKey
}): TelemetryHealthStatus => {
  if (latestAgeMs > FRESHNESS_THRESHOLD_MS) {
    return 'no-recent-data'
  }

  if (hasImpossibleLatestReading) {
    return 'warning'
  }

  if (
    coveragePercent !== null &&
    coveragePercent < COVERAGE_WARNING_THRESHOLD_PERCENT
  ) {
    return 'warning'
  }

  if (
    largestGapMs !== null &&
    largestGapMs > FRESHNESS_THRESHOLD_MS &&
    (historyWindowKey === '24h' || historyWindowKey === '7d')
  ) {
    return 'warning'
  }

  return 'healthy'
}
