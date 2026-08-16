import { FRESHNESS_THRESHOLD_MS } from './deviceStatusHealth.ts'
import {
  doesHostedGen2RowMatchCard,
  normalizeHostedGen2ComparisonText,
  type HostedGen2CardCatalogDescriptor,
} from './hostedGen2Presentation.ts'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

export type CommissionedCardEvidence = {
  latestPackageMeasuredAt: string | null
  latestPackageMeasuredAtMs: number | null
  latestMatchingRow: HostedGen2MeasurementRow | null
  appearsInLatestPackage: boolean
  lastGoodRow: HostedGen2MeasurementRow | null
  latestMatchingIsCurrent: boolean
}

const GOOD_QUALITY_VALUES = new Set(['good', 'diagnostic', 'ok', 'okay'])

export const resolveCommissionedCardEvidence = (
  descriptor: HostedGen2CardCatalogDescriptor,
  rows: readonly HostedGen2MeasurementRow[],
  nowMs = Date.now(),
): CommissionedCardEvidence => {
  const chronologicalRows = [...rows].sort(compareNewestFirst)
  const latestPackageRow = chronologicalRows[0] ?? null
  const matchingRows = chronologicalRows.filter((row) =>
    doesHostedGen2RowMatchCard(row, descriptor))
  const latestMatchingRow = matchingRows[0] ?? null
  const lastGoodRow = matchingRows.find(isGoodEvidence) ?? null
  const latestMatchingMs = getTimestampMs(latestMatchingRow?.measured_at)

  return {
    latestPackageMeasuredAt: latestPackageRow?.measured_at ?? null,
    latestPackageMeasuredAtMs: latestPackageRow
      ? getTimestampMs(latestPackageRow.measured_at)
      : null,
    latestMatchingRow,
    appearsInLatestPackage: Boolean(
      latestMatchingRow && latestPackageRow &&
      latestMatchingRow.measured_at === latestPackageRow.measured_at,
    ),
    lastGoodRow,
    latestMatchingIsCurrent: latestMatchingMs !== null &&
      nowMs >= latestMatchingMs && nowMs - latestMatchingMs <= FRESHNESS_THRESHOLD_MS,
  }
}

const isGoodEvidence = (row: HostedGen2MeasurementRow): boolean =>
  typeof row.measurement_value === 'number' &&
  Number.isFinite(row.measurement_value) &&
  row.valid === true &&
  GOOD_QUALITY_VALUES.has(normalizeHostedGen2ComparisonText(row.quality))

const compareNewestFirst = (
  left: HostedGen2MeasurementRow,
  right: HostedGen2MeasurementRow,
): number => (getTimestampMs(right.measured_at) ?? Number.NEGATIVE_INFINITY) -
  (getTimestampMs(left.measured_at) ?? Number.NEGATIVE_INFINITY)

export const describeLastGoodEvidenceSource = (
  lastGoodMeasuredAt: string,
  latestMatchingMeasuredAt: string | null,
  latestPackageMeasuredAt: string | null,
): string => {
  const latestSeriesText = latestMatchingMeasuredAt && latestMatchingMeasuredAt !== lastGoodMeasuredAt
    ? ` Latest commissioned-series evidence: ${latestMatchingMeasuredAt}.`
    : ''
  const latestPackageText = latestPackageMeasuredAt
    ? ` Latest device package: ${latestPackageMeasuredAt}.`
    : ''
  return `Last good evidence: ${lastGoodMeasuredAt}.${latestSeriesText}${latestPackageText}`
}

const getTimestampMs = (value: string | null | undefined): number | null => {
  const timestampMs = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(timestampMs) ? timestampMs : null
}
