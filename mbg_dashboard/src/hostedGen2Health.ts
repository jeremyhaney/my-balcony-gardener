import type { HistoryWindowKey } from './historyControls'
import {
  buildDeviceStatusHealth,
  COVERAGE_WARNING_THRESHOLD_PERCENT,
  FRESHNESS_THRESHOLD_MS,
  getExpectedRowsForWindow,
  getLargestGapMsFromTimestamps,
  type DeviceStatusHealth,
  type DeviceStatusHealthStatus,
} from './deviceStatusHealth'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

export type HostedGen2Health = DeviceStatusHealth<string>

type Gen2ReportSample = {
  measuredAt: string
  measuredAtMs: number
  rows: HostedGen2MeasurementRow[]
}

type LatestSampleQuality = {
  displayableMeasurementCount: number
  hasWarnings: boolean
  notes: string[]
}

const QUALITY_VALUES_WITHOUT_WARNINGS = new Set(['good', 'diagnostic', 'ok', 'okay'])

export const calculateHostedGen2Health = (
  rows: HostedGen2MeasurementRow[],
  historyWindowKey: HistoryWindowKey,
  now: Date = new Date(),
): HostedGen2Health => {
  const samples = getReportSamples(rows)
  const samplesInWindow = samples.length
  const expectedRows = getExpectedRowsForWindow(historyWindowKey)

  if (rows.length === 0) {
    return buildHostedGen2Health({
      status: 'no-data',
      rowsInWindow: 0,
      validTimestampRows: 0,
      expectedRows,
      coveragePercent: expectedRows === null ? null : 0,
      latestTimestamp: null,
      latestAgeMs: null,
      largestGapMs: null,
      latestReadings: null,
      wateringMarkersInHistory: null,
      notes: ['No Gen2 measurement rows were returned for the selected device/window.'],
    })
  }

  if (samplesInWindow === 0) {
    return buildHostedGen2Health({
      status: 'no-data',
      rowsInWindow: 0,
      validTimestampRows: 0,
      expectedRows,
      coveragePercent: expectedRows === null ? null : 0,
      latestTimestamp: null,
      latestAgeMs: null,
      largestGapMs: null,
      latestReadings: null,
      wateringMarkersInHistory: null,
      notes: ['Gen2 rows were returned, but none had a parseable report time.'],
    })
  }

  const latestSample = samples[samples.length - 1]
  const latestAgeMs = now.getTime() - latestSample.measuredAtMs
  const largestGapMs = getLargestGapMsFromTimestamps(
    samples.map((sample) => sample.measuredAtMs),
  )
  const coveragePercent =
    expectedRows === null ? null : (samplesInWindow / expectedRows) * 100
  const latestSampleQuality = getLatestSampleQuality(latestSample.rows)
  const hasFreshnessWarning = latestAgeMs > FRESHNESS_THRESHOLD_MS
  const hasCoverageWarning =
    coveragePercent !== null &&
    coveragePercent < COVERAGE_WARNING_THRESHOLD_PERCENT
  const hasGapWarning =
    largestGapMs !== null &&
    largestGapMs > FRESHNESS_THRESHOLD_MS &&
    (historyWindowKey === '24h' || historyWindowKey === '7d')
  const notes: string[] = []

  if (hasFreshnessWarning) {
    notes.push('The newest Gen2 report sample is older than the freshness threshold.')
  }

  if (hasCoverageWarning) {
    notes.push('The selected window has fewer Gen2 report samples than expected for normal reporting.')
  }

  if (hasGapWarning) {
    notes.push('There is a long gap between Gen2 report samples in this history window.')
  }

  notes.push(...latestSampleQuality.notes)

  const status: DeviceStatusHealthStatus =
    hasFreshnessWarning ||
    hasCoverageWarning ||
    hasGapWarning ||
    latestSampleQuality.hasWarnings
      ? 'warning'
      : 'healthy'

  return buildHostedGen2Health({
    status,
    rowsInWindow: samplesInWindow,
    validTimestampRows: samplesInWindow,
    expectedRows,
    coveragePercent,
    latestTimestamp: latestSample.measuredAt,
    latestAgeMs,
    largestGapMs,
    latestReadings:
      latestSampleQuality.displayableMeasurementCount === 0
        ? 'No displayable measurements in latest sample'
        : `${latestSampleQuality.displayableMeasurementCount} displayable measurements in latest sample`,
    wateringMarkersInHistory: null,
    notes,
  })
}

const buildHostedGen2Health = (
  health: Omit<HostedGen2Health, 'statusLabel'>,
): HostedGen2Health =>
  buildDeviceStatusHealth({
    rowsInWindowLabel: 'Samples in window',
    expectedRowsLabel: 'Expected samples',
    latestReadingsLabel: 'Latest sample',
    wateringMarkersLabel: 'Watering history markers',
    ...health,
  })

const getReportSamples = (rows: HostedGen2MeasurementRow[]): Gen2ReportSample[] => {
  const samplesByTimestamp = new Map<number, Gen2ReportSample>()

  rows.forEach((row) => {
    const measuredAtMs = new Date(row.measured_at).getTime()

    if (!Number.isFinite(measuredAtMs)) {
      return
    }

    const existingSample = samplesByTimestamp.get(measuredAtMs)

    if (existingSample) {
      existingSample.rows.push(row)
      return
    }

    samplesByTimestamp.set(measuredAtMs, {
      measuredAt: row.measured_at,
      measuredAtMs,
      rows: [row],
    })
  })

  return Array.from(samplesByTimestamp.values()).sort(
    (left, right) => left.measuredAtMs - right.measuredAtMs,
  )
}

const getLatestSampleQuality = (
  rows: HostedGen2MeasurementRow[],
): LatestSampleQuality => {
  let hasInvalidMeasurement = false
  let hasQualityWarning = false
  let hasMissingDisplayValue = false
  let displayableMeasurementCount = 0
  const warningReasons = new Set<string>()

  rows.forEach((row) => {
    if (isExpectedNotInstalledRow(row)) {
      return
    }

    const hasMeasurementName = Boolean(row.measurement_name?.trim())
    const hasDisplayValue =
      typeof row.measurement_value === 'number' && Number.isFinite(row.measurement_value)

    if (hasMeasurementName && row.valid !== false && hasDisplayValue) {
      displayableMeasurementCount += 1
    }

    if (row.valid === false) {
      hasInvalidMeasurement = true
      addReason(warningReasons, row.reason)
    }

    if (hasQualityMetadataWarning(row.quality)) {
      hasQualityWarning = true
      addReason(warningReasons, row.reason)
    }

    if (hasMeasurementName && row.valid !== false && !hasDisplayValue) {
      hasMissingDisplayValue = true
      addReason(warningReasons, row.reason)
    }
  })

  const notes: string[] = []

  if (hasInvalidMeasurement) {
    notes.push('The latest Gen2 sample includes one or more invalid measurement rows.')
  }

  if (hasQualityWarning) {
    notes.push('The latest Gen2 sample includes measurement quality metadata that needs review.')
  }

  if (hasMissingDisplayValue) {
    notes.push('The latest Gen2 sample includes a measurement row without a displayable numeric value.')
  }

  if (displayableMeasurementCount === 0) {
    notes.push('The latest Gen2 sample has no displayable measurements.')
  }

  if (warningReasons.size > 0) {
    notes.push(`Gen2 metadata reason: ${Array.from(warningReasons).join(', ')}.`)
  }

  return {
    displayableMeasurementCount,
    hasWarnings:
      hasInvalidMeasurement ||
      hasQualityWarning ||
      hasMissingDisplayValue ||
      displayableMeasurementCount === 0,
    notes,
  }
}

const isExpectedNotInstalledRow = (row: HostedGen2MeasurementRow): boolean => {
  const normalizedQuality = normalizeText(row.quality)

  return (
    (normalizedQuality === 'not_installed' || normalizedQuality === 'not installed') &&
    normalizeText(row.reason) === 'profile_not_installed' &&
    row.valid === false &&
    row.measurement_value === null
  )
}

const hasQualityMetadataWarning = (quality: string | null | undefined): boolean => {
  const normalizedQuality = normalizeText(quality)

  return !normalizedQuality || !QUALITY_VALUES_WITHOUT_WARNINGS.has(normalizedQuality)
}

const addReason = (reasons: Set<string>, reason: string | null | undefined) => {
  const normalizedReason = reason?.trim()

  if (normalizedReason) {
    reasons.add(normalizedReason)
  }
}

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? ''
