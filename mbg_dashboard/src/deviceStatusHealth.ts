import type { HistoryWindowKey } from './historyControls'

export type DeviceStatusHealthStatus = 'healthy' | 'warning' | 'no-recent-data' | 'no-data'

export type DeviceStatusHealth<TLatestReadings = unknown> = {
  status: DeviceStatusHealthStatus
  statusLabel: string
  rowsInWindow: number
  rowsInWindowLabel?: string
  validTimestampRows: number
  expectedRows: number | null
  expectedRowsLabel?: string
  coveragePercent: number | null
  latestTimestamp: string | null
  latestAgeMs: number | null
  largestGapMs: number | null
  latestReadings: TLatestReadings | null
  latestReadingsLabel?: string
  wateringMarkersInHistory: number | null
  wateringMarkersLabel?: string
  notes: string[]
}

export const NORMAL_CADENCE_MINUTES = 15
export const FRESHNESS_THRESHOLD_MS = 45 * 60 * 1000
export const COVERAGE_WARNING_THRESHOLD_PERCENT = 70

const EXPECTED_ROWS_PER_DAY = (24 * 60) / NORMAL_CADENCE_MINUTES

const EXPECTED_ROWS_BY_WINDOW: Partial<Record<HistoryWindowKey, number>> = {
  '24h': EXPECTED_ROWS_PER_DAY,
  '7d': 7 * EXPECTED_ROWS_PER_DAY,
  '1m': 30 * EXPECTED_ROWS_PER_DAY,
  '3m': 90 * EXPECTED_ROWS_PER_DAY,
  '6m': 180 * EXPECTED_ROWS_PER_DAY,
  '1y': 365 * EXPECTED_ROWS_PER_DAY,
}

const STATUS_LABELS: Record<DeviceStatusHealthStatus, string> = {
  healthy: 'Device Status',
  warning: 'Device Status',
  'no-recent-data': 'Device Status',
  'no-data': 'Device Status',
}

export const getExpectedRowsForWindow = (
  historyWindowKey: HistoryWindowKey,
): number | null => EXPECTED_ROWS_BY_WINDOW[historyWindowKey] ?? null

export const buildDeviceStatusHealth = <TLatestReadings>(
  health: Omit<DeviceStatusHealth<TLatestReadings>, 'statusLabel'>,
): DeviceStatusHealth<TLatestReadings> => ({
  ...health,
  statusLabel: STATUS_LABELS[health.status],
})

export const getLargestGapMsFromTimestamps = (timestampMsValues: number[]): number | null => {
  if (timestampMsValues.length < 2) {
    return null
  }

  const sortedTimestampMsValues = [...timestampMsValues].sort((left, right) => left - right)
  let largestGapMs = 0

  for (let index = 1; index < sortedTimestampMsValues.length; index += 1) {
    largestGapMs = Math.max(
      largestGapMs,
      sortedTimestampMsValues[index] - sortedTimestampMsValues[index - 1],
    )
  }

  return largestGapMs
}
