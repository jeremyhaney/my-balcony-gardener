import { FRESHNESS_THRESHOLD_MS } from './deviceStatusHealth'
import {
  getHostedGen2CompoundIdentity,
  normalizeHostedGen2ComparisonText,
} from './hostedGen2Presentation'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

export type HostedGen2DisplayMode = 'latest' | 'recent-good' | 'unavailable'

export type HostedGen2MeasurementDisplayModel = {
  latestRow: HostedGen2MeasurementRow
  displayRow: HostedGen2MeasurementRow | null
  recentGoodRow: HostedGen2MeasurementRow | null
  mode: HostedGen2DisplayMode
  labelOverride?: string
  message?: string
  detailReason?: string
  trustFlags: string[]
}

const UNUSABLE_QUALITY_VALUES = new Set([
  'failed',
  'missing',
  'disabled',
  'not_installed',
  'not installed',
  'unavailable',
])
const RECENT_GOOD_QUALITY_VALUES = new Set(['good', 'diagnostic', 'ok', 'okay'])

export const getHostedGen2MeasurementDisplayModels = (
  rows: HostedGen2MeasurementRow[],
): HostedGen2MeasurementDisplayModel[] => {
  const rowsByIdentity = new Map<string, HostedGen2MeasurementRow[]>()

  // Generic display models share the approved compound device/sensor/measurement/unit identity.
  rows.forEach((row) => {
    const identity = getHostedGen2CompoundIdentity(row)
    const existingRows = rowsByIdentity.get(identity)

    if (existingRows) {
      existingRows.push(row)
      return
    }

    rowsByIdentity.set(identity, [row])
  })

  return Array.from(rowsByIdentity.values())
    .map((identityRows) => getDisplayModelForIdentity(identityRows))
    .filter((model): model is HostedGen2MeasurementDisplayModel => Boolean(model))
}

// Catalog cards use a strict exact-identity recent-good lookup for an unusable latest row.
export const getHostedGen2RecentGoodRow = (
  latestRow: HostedGen2MeasurementRow,
  rows: readonly HostedGen2MeasurementRow[],
): HostedGen2MeasurementRow | null => {
  if (isApprovedRecentGoodCandidate(latestRow)) {
    return null
  }

  const latestMs = getTimestampMs(latestRow.measured_at)
  if (!Number.isFinite(latestMs)) {
    return null
  }

  const identity = getHostedGen2CompoundIdentity(latestRow)

  return (
    rows
      .filter((row) => getHostedGen2CompoundIdentity(row) === identity)
      .filter(isApprovedRecentGoodCandidate)
      .map((row) => ({ row, measuredAtMs: getTimestampMs(row.measured_at) }))
      .filter(
        ({ measuredAtMs }) =>
          Number.isFinite(measuredAtMs) &&
          measuredAtMs <= latestMs &&
          latestMs - measuredAtMs <= FRESHNESS_THRESHOLD_MS,
      )
      .sort((left, right) => right.measuredAtMs - left.measuredAtMs)[0]?.row ?? null
  )
}

export const isDisplayableHostedGen2Row = (
  row: HostedGen2MeasurementRow | null | undefined,
): row is HostedGen2MeasurementRow & { measurement_value: number } => {
  if (!row) {
    return false
  }

  return (
    typeof row.measurement_value === 'number' &&
    Number.isFinite(row.measurement_value) &&
    row.valid === true &&
    !UNUSABLE_QUALITY_VALUES.has(normalizeText(row.quality))
  )
}

const getDisplayModelForIdentity = (
  rows: HostedGen2MeasurementRow[],
): HostedGen2MeasurementDisplayModel | null => {
  const sortedRows = [...rows].sort(compareRowsNewestFirst)
  const latestRow = sortedRows[0]

  if (!latestRow) {
    return null
  }

  if (isDisplayableHostedGen2Row(latestRow)) {
    return {
      latestRow,
      displayRow: latestRow,
      recentGoodRow: null,
      mode: 'latest',
      trustFlags: [],
    }
  }

  const recentGoodRow = sortedRows
    .slice(1)
    .find((row) => isDisplayableHostedGen2Row(row) && isRecentEnough(latestRow, row))

  if (recentGoodRow) {
    return {
      latestRow,
      displayRow: recentGoodRow,
      recentGoodRow,
      mode: 'recent-good',
      labelOverride: 'Using Recent Value',
      message: getRecentGoodMessage(latestRow),
      detailReason: getRecentGoodDetailReason(latestRow),
      trustFlags: ['latest-read-failed', 'recent-good-display'],
    }
  }

  return {
    latestRow,
    displayRow: null,
    recentGoodRow: null,
    mode: 'unavailable',
    labelOverride: 'Check Sensor',
    message: 'Fresh read failed; no recent good reading is available.',
    detailReason: 'The latest garden reading is not displayable and no recent good same-sensor value was found in the selected window.',
    trustFlags: ['latest-read-failed', 'no-recent-good-value'],
  }
}

const getRecentGoodMessage = (latestRow: HostedGen2MeasurementRow): string => {
  const measurementName = normalizeText(latestRow.measurement_name)

  if (measurementName === 'moisture_index') {
    return 'Fresh control evidence failed; recent value is display-only.'
  }

  if (measurementName === 'raw_adc') {
    return 'Fresh diagnostic read failed; recent diagnostic value shown.'
  }

  return 'Fresh read failed; recent good reading shown.'
}

const getRecentGoodDetailReason = (latestRow: HostedGen2MeasurementRow): string => {
  const measurementName = normalizeText(latestRow.measurement_name)

  if (measurementName === 'moisture_index') {
    return 'Recent value is shown for display only. It does not authorize watering and does not change garden unit watering eligibility.'
  }

  if (measurementName === 'raw_adc') {
    return 'Recent Raw ADC value is diagnostic display evidence only and is not calibrated moisture.'
  }

  return 'Latest read metadata is preserved below; the displayed value comes from recent good evidence for the same measurement identity.'
}

const isRecentEnough = (
  latestRow: HostedGen2MeasurementRow,
  candidateRow: HostedGen2MeasurementRow,
): boolean => {
  const latestMs = getTimestampMs(latestRow.measured_at)
  const candidateMs = getTimestampMs(candidateRow.measured_at)

  if (!Number.isFinite(latestMs) || !Number.isFinite(candidateMs)) {
    return false
  }

  return latestMs >= candidateMs && latestMs - candidateMs <= FRESHNESS_THRESHOLD_MS
}

const compareRowsNewestFirst = (
  left: HostedGen2MeasurementRow,
  right: HostedGen2MeasurementRow,
): number => {
  const measuredAtDiff = getTimestampMs(right.measured_at) - getTimestampMs(left.measured_at)

  if (measuredAtDiff !== 0) {
    return measuredAtDiff
  }

  return left.record_index - right.record_index
}

const getTimestampMs = (value: string): number => {
  const timestampMs = new Date(value).getTime()
  return Number.isFinite(timestampMs) ? timestampMs : Number.NaN
}

const isApprovedRecentGoodCandidate = (
  row: HostedGen2MeasurementRow,
): row is HostedGen2MeasurementRow & { measurement_value: number } =>
  typeof row.measurement_value === 'number' &&
  Number.isFinite(row.measurement_value) &&
  row.valid === true &&
  RECENT_GOOD_QUALITY_VALUES.has(normalizeHostedGen2ComparisonText(row.quality))

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? ''
