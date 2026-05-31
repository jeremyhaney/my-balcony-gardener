import type { HistoryWindowKey } from './historyControls'
import type { SensorLogRow } from './types/sensorLog'
import {
  buildDeviceStatusHealth,
  COVERAGE_WARNING_THRESHOLD_PERCENT,
  FRESHNESS_THRESHOLD_MS,
  getExpectedRowsForWindow,
  getLargestGapMsFromTimestamps,
  type DeviceStatusHealth,
  type DeviceStatusHealthStatus,
} from './deviceStatusHealth'

export type TelemetryHealthStatus = DeviceStatusHealthStatus

export type LatestTelemetryReadings = {
  temperature: number | null
  humidity: number | null
  moisture: number | null
}

export type TelemetryHealth = DeviceStatusHealth<LatestTelemetryReadings>

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
  const expectedRows = getExpectedRowsForWindow(historyWindowKey)
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
  const largestGapMs = getLargestGapMsFromTimestamps(
    rowsWithValidTimestamps.map((row) => row.timestampMs),
  )
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
  ...buildDeviceStatusHealth(health),
})

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
