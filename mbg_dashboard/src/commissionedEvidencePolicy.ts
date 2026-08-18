import type { HostedGen2CardCatalogDescriptor } from './hostedGen2Presentation.ts'
import {
  doesHostedGen2RowMatchCard,
  normalizeHostedGen2ComparisonText,
} from './hostedGen2Presentation.ts'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements.ts'

export const EXPECTED_REPORTING_CADENCE_MS = 15 * 60 * 1000
export const DELIVERY_GRACE_MS = 5 * 60 * 1000
export const COMMISSIONED_FRESHNESS_LIMIT_MS =
  3 * EXPECTED_REPORTING_CADENCE_MS + DELIVERY_GRACE_MS
export const COMMISSIONED_ACTIONABLE_AGE_MS =
  6 * EXPECTED_REPORTING_CADENCE_MS + DELIVERY_GRACE_MS

export type CommissionedEvidenceSeverity = 'neutral' | 'informational' | 'caution' | 'actionable'
export type CommissionedEvidenceReason =
  | 'current'
  | 'invalid'
  | 'omitted'
  | 'not-current'
  | 'presentation-ineligible'
  | 'no-window-evidence'
  | 'derived-unavailable'

export type BoundedConsecutiveCount = {
  count: number
  isLowerBound: boolean
}

export type CommissionedEvidencePolicy = {
  reason: CommissionedEvidenceReason
  label: string
  detail: string | null
  severity: CommissionedEvidenceSeverity
  lastGoodAgeMs: number | null
  conditionIsCurrent: boolean
  invalidCount: BoundedConsecutiveCount
  omissionCount: BoundedConsecutiveCount
}

const GOOD_QUALITY_VALUES = new Set(['good', 'diagnostic', 'ok', 'okay'])

export const evaluateCommissionedEvidencePolicy = ({
  descriptor,
  rows,
  latestMatchingRow,
  lastGoodRow,
  lastPresentationEligibleRow = lastGoodRow,
  latestPresentationEligible = true,
  latestPresentationDetail = null,
  appearsInLatestPackage,
  deviceReportingActive,
  derivedValueAvailable = true,
  nowMs = Date.now(),
}: {
  descriptor: HostedGen2CardCatalogDescriptor
  rows: readonly HostedGen2MeasurementRow[]
  latestMatchingRow: HostedGen2MeasurementRow | null
  lastGoodRow: HostedGen2MeasurementRow | null
  lastPresentationEligibleRow?: HostedGen2MeasurementRow | null
  latestPresentationEligible?: boolean
  latestPresentationDetail?: string | null
  appearsInLatestPackage: boolean
  deviceReportingActive: boolean
  derivedValueAvailable?: boolean
  nowMs?: number
}): CommissionedEvidencePolicy => {
  const invalidCount = countConsecutiveOutcomes(descriptor, rows, 'invalid')
  const omissionCount = countConsecutiveOutcomes(descriptor, rows, 'omitted')
  const lastGoodAgeMs = getAgeMs(lastPresentationEligibleRow?.measured_at, nowMs)
  const conditionIsCurrent = lastGoodAgeMs !== null && lastGoodAgeMs >= 0 &&
    lastGoodAgeMs <= COMMISSIONED_FRESHNESS_LIMIT_MS

  if (!derivedValueAvailable) {
    const latestInvalid = Boolean(latestMatchingRow && !isUsableEvidence(latestMatchingRow))
    return buildPolicy(
      'derived-unavailable',
      'Derived value unavailable',
      latestInvalid ? 'Latest reading invalid' : null,
      latestInvalid
        ? invalidCount.count >= 2 ? 'caution' : 'informational'
        : 'neutral', {
      lastGoodAgeMs, conditionIsCurrent: false, invalidCount, omissionCount,
    })
  }

  if (!latestMatchingRow) {
    return buildPolicy(
      lastGoodRow ? 'omitted' : 'no-window-evidence',
      lastGoodRow ? 'Last Good' : 'No Reading in Selected Window',
      lastGoodRow ? 'Missing from latest update' : null,
      omissionCount.count >= 3 ? 'caution' : lastGoodRow ? 'informational' : 'neutral',
      { lastGoodAgeMs, conditionIsCurrent, invalidCount, omissionCount },
    )
  }

  if (!latestPresentationEligible) {
    const ageSeverity = getAgeSeverity(lastGoodAgeMs, deviceReportingActive)
    return buildPolicy(
      'presentation-ineligible',
      lastPresentationEligibleRow ? 'Last Reliable' : 'Reading Unavailable',
      latestPresentationDetail ?? 'Latest reading outside the approved presentation range',
      maxSeverity('informational', ageSeverity),
      { lastGoodAgeMs, conditionIsCurrent, invalidCount, omissionCount },
    )
  }

  const latestIsUsable = isUsableEvidence(latestMatchingRow)
  if (!latestIsUsable) {
    const ageSeverity = getAgeSeverity(lastGoodAgeMs, deviceReportingActive)
    return buildPolicy(
      'invalid',
      lastGoodRow ? 'Last Good' : 'Latest reading invalid',
      'Latest reading invalid',
      maxSeverity(invalidCount.count >= 2 ? 'caution' : 'informational', ageSeverity),
      { lastGoodAgeMs, conditionIsCurrent, invalidCount, omissionCount },
    )
  }

  if (!appearsInLatestPackage) {
    const ageSeverity = getAgeSeverity(lastGoodAgeMs, deviceReportingActive)
    return buildPolicy(
      'omitted',
      'Last Good',
      'Missing from latest update',
      maxSeverity(omissionCount.count >= 3 ? 'caution' : 'informational', ageSeverity),
      { lastGoodAgeMs, conditionIsCurrent, invalidCount, omissionCount },
    )
  }

  const latestAgeMs = getAgeMs(latestMatchingRow.measured_at, nowMs)
  if (latestAgeMs === null || latestAgeMs < 0 || latestAgeMs > COMMISSIONED_FRESHNESS_LIMIT_MS) {
    return buildPolicy(
      'not-current',
      deviceReportingActive && latestAgeMs !== null && latestAgeMs > COMMISSIONED_ACTIONABLE_AGE_MS
        ? 'Check Sensor'
        : 'Not Current',
      deviceReportingActive ? null : 'Device reporting unavailable',
      getAgeSeverity(latestAgeMs, deviceReportingActive),
      { lastGoodAgeMs, conditionIsCurrent: false, invalidCount, omissionCount },
    )
  }

  return buildPolicy('current', 'Current', null, 'neutral', {
    lastGoodAgeMs, conditionIsCurrent: true, invalidCount, omissionCount,
  })
}

const buildPolicy = (
  reason: CommissionedEvidenceReason,
  label: string,
  detail: string | null,
  severity: CommissionedEvidenceSeverity,
  rest: Pick<CommissionedEvidencePolicy, 'lastGoodAgeMs' | 'conditionIsCurrent' | 'invalidCount' | 'omissionCount'>,
): CommissionedEvidencePolicy => ({ reason, label, detail, severity, ...rest })

const countConsecutiveOutcomes = (
  descriptor: HostedGen2CardCatalogDescriptor,
  rows: readonly HostedGen2MeasurementRow[],
  outcome: 'invalid' | 'omitted',
): BoundedConsecutiveCount => {
  const packages = getPackagesNewestFirst(rows)
  let count = 0
  for (const packageRows of packages) {
    const matchingRow = packageRows.find((row) => doesHostedGen2RowMatchCard(row, descriptor))
    const matchesOutcome = outcome === 'omitted'
      ? !matchingRow
      : Boolean(matchingRow && !isUsableEvidence(matchingRow))
    if (!matchesOutcome) break
    count += 1
  }
  return { count, isLowerBound: count > 0 && count === packages.length }
}

const getPackagesNewestFirst = (
  rows: readonly HostedGen2MeasurementRow[],
): HostedGen2MeasurementRow[][] => {
  const packages = new Map<number, HostedGen2MeasurementRow[]>()
  rows.forEach((row) => {
    const timestamp = new Date(row.measured_at).getTime()
    if (!Number.isFinite(timestamp)) return
    const packageRows = packages.get(timestamp) ?? []
    packageRows.push(row)
    packages.set(timestamp, packageRows)
  })
  return [...packages.entries()]
    .sort(([left], [right]) => right - left)
    .map(([, packageRows]) => packageRows)
}

const isUsableEvidence = (row: HostedGen2MeasurementRow): boolean =>
  typeof row.measurement_value === 'number' && Number.isFinite(row.measurement_value) &&
  row.valid === true && GOOD_QUALITY_VALUES.has(normalizeHostedGen2ComparisonText(row.quality))

const getAgeMs = (value: string | null | undefined, nowMs: number): number | null => {
  const timestamp = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(timestamp) ? nowMs - timestamp : null
}

const getAgeSeverity = (
  ageMs: number | null,
  deviceReportingActive: boolean,
): CommissionedEvidenceSeverity => {
  if (ageMs === null || ageMs < 0) return 'caution'
  if (ageMs > COMMISSIONED_ACTIONABLE_AGE_MS && deviceReportingActive) return 'actionable'
  if (ageMs > COMMISSIONED_FRESHNESS_LIMIT_MS) return 'caution'
  return 'informational'
}

const SEVERITY_ORDER: CommissionedEvidenceSeverity[] = [
  'neutral', 'informational', 'caution', 'actionable',
]

const maxSeverity = (
  left: CommissionedEvidenceSeverity,
  right: CommissionedEvidenceSeverity,
): CommissionedEvidenceSeverity =>
  SEVERITY_ORDER.indexOf(left) >= SEVERITY_ORDER.indexOf(right) ? left : right
