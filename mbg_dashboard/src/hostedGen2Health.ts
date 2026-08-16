import type { HistoryWindowKey } from './historyControls.ts'
import {
  buildDeviceStatusHealth,
  COVERAGE_WARNING_THRESHOLD_PERCENT,
  FRESHNESS_THRESHOLD_MS,
  getExpectedRowsForWindow,
  getLargestGapMsFromTimestamps,
  type DeviceStatusHealth,
  type DeviceStatusHealthStatus,
} from './deviceStatusHealth.ts'
import {
  HOSTED_GEN2_CARD_CATALOG,
  doesHostedGen2RowMatchCard,
  getHostedGen2CanonicalMeasurementIdentity,
  normalizeHostedGen2ComparisonText,
  type HostedGen2CardCatalogDescriptor,
} from './hostedGen2Presentation.ts'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements.ts'

export type HostedGen2QualityTone = 'good' | 'watch' | 'check' | 'neutral'

export type HostedGen2ReadingAge = {
  latestTimestamp: string | null
  latestAgeMs: number | null
  hasTimestamp: boolean
  isCurrent: boolean
  tone: HostedGen2QualityTone
}

export type HostedGen2SensorAvailability = {
  expectedEntryCount: number
  reportedEntryCount: number
  absentEntryCount: number
  expectedPhysicalSensorCount: number
  representedPhysicalSensorCount: number
  profileNotInstalledEntryCount: number
  absentEntryLabels: string[]
  tone: HostedGen2QualityTone
}

export type HostedGen2ReadingHistory = {
  packageCount: number
  expectedPackageCount: number | null
  coveragePercent: number | null
  largestGapMs: number | null
  hasCoverageWarning: boolean
  hasGapWarning: boolean
  tone: HostedGen2QualityTone
}

export type HostedGen2LatestReadingChecks = {
  expectedEntryCount: number
  matchedEntryCount: number
  usableEntryCount: number
  invalidEntryCount: number
  qualityWarningEntryCount: number
  missingValueEntryCount: number
  sensorNotDetectedEntryCount: number
  profileNotInstalledEntryCount: number
  absentEntryCount: number
  reasons: string[]
  tone: HostedGen2QualityTone
}

export type HostedGen2AttentionItem = {
  key: string
  message: string
}

export type HostedGen2Health = DeviceStatusHealth<string> & {
  kind: 'hosted-gen2'
  readingAge: HostedGen2ReadingAge
  sensorAvailability: HostedGen2SensorAvailability
  readingHistory: HostedGen2ReadingHistory
  latestReadingChecks: HostedGen2LatestReadingChecks
  attentionItems: HostedGen2AttentionItem[]
}

type Gen2ReportSample = {
  measuredAt: string
  measuredAtMs: number
  rows: HostedGen2MeasurementRow[]
}

type MatchedCatalogEntry = {
  descriptor: HostedGen2CardCatalogDescriptor
  row: HostedGen2MeasurementRow | null
  profileNotInstalled: boolean
}

const QUALITY_VALUES_WITHOUT_WARNINGS = new Set(['good', 'diagnostic', 'ok', 'okay'])

export const calculateHostedGen2Health = (
  rows: HostedGen2MeasurementRow[],
  historyWindowKey: HistoryWindowKey,
  now: Date = new Date(),
  expectedDescriptors: readonly HostedGen2CardCatalogDescriptor[] = HOSTED_GEN2_CARD_CATALOG,
): HostedGen2Health => {
  const samples = getReportSamples(rows)
  const latestSample = samples[samples.length - 1] ?? null
  const expectedPackages = getExpectedRowsForWindow(historyWindowKey)
  const latestAgeMs = latestSample ? now.getTime() - latestSample.measuredAtMs : null

  // Reading Age is evaluated independently from package completeness and row quality.
  const readingAge = getReadingAge(latestSample, latestAgeMs)

  // Reading History uses report packages rather than flattened measurement rows.
  const readingHistory = getReadingHistory(samples, expectedPackages, historyWindowKey)

  // Sensor Availability matches the caller's expected presentation at the latest timestamp.
  const matchedEntries = latestSample
    ? getMatchedCatalogEntries(latestSample, expectedDescriptors)
    : expectedDescriptors.map((descriptor) => ({
        descriptor,
        row: null,
        profileNotInstalled: false,
      }))
  const sensorAvailability = getSensorAvailability(
    matchedEntries, Boolean(latestSample), expectedDescriptors,
  )

  // Latest Reading Checks evaluate only expected catalog entries and endpoint evidence.
  const latestReadingChecks = getLatestSampleQuality(
    matchedEntries, Boolean(latestSample), expectedDescriptors.length,
  )

  // Needs Attention contains only observed, qualifying evidence.
  const attentionItems = getAttentionItems({
    rows,
    latestSample,
    readingAge,
    readingHistory,
    sensorAvailability,
    latestReadingChecks,
    matchedEntries,
  })
  const status: DeviceStatusHealthStatus =
    rows.length === 0 || samples.length === 0
      ? 'no-data'
      : attentionItems.length > 0
        ? 'warning'
        : 'healthy'
  const notes = attentionItems.map((item) => item.message)

  return buildHostedGen2Health({
    status,
    rowsInWindow: samples.length,
    validTimestampRows: samples.length,
    expectedRows: expectedPackages,
    coveragePercent: readingHistory.coveragePercent,
    latestTimestamp: readingAge.latestTimestamp,
    latestAgeMs: readingAge.latestAgeMs,
    largestGapMs: readingHistory.largestGapMs,
    latestReadings:
      latestSample === null
        ? null
        : `${latestReadingChecks.usableEntryCount} usable expected readings in latest sample`,
    wateringMarkersInHistory: null,
    notes,
    readingAge,
    sensorAvailability,
    readingHistory,
    latestReadingChecks,
    attentionItems,
  })
}

const buildHostedGen2Health = (
  health: Omit<HostedGen2Health, 'kind' | 'statusLabel'>,
): HostedGen2Health => ({
  ...buildDeviceStatusHealth({
    rowsInWindowLabel: 'Samples in window',
    expectedRowsLabel: 'Expected samples',
    latestReadingsLabel: 'Latest sample',
    wateringMarkersLabel: 'Watering history markers',
    ...health,
  }),
  ...health,
  kind: 'hosted-gen2',
})

const getReportSamples = (rows: HostedGen2MeasurementRow[]): Gen2ReportSample[] => {
  const samplesByTimestamp = new Map<number, Gen2ReportSample>()

  rows.forEach((row) => {
    const measuredAtMs = new Date(row.measured_at).getTime()
    if (!Number.isFinite(measuredAtMs)) return

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

const getReadingAge = (
  latestSample: Gen2ReportSample | null,
  latestAgeMs: number | null,
): HostedGen2ReadingAge => {
  const hasTimestamp = latestSample !== null && latestAgeMs !== null
  const isCurrent = hasTimestamp && latestAgeMs >= 0 && latestAgeMs <= FRESHNESS_THRESHOLD_MS

  return {
    latestTimestamp: latestSample?.measuredAt ?? null,
    latestAgeMs,
    hasTimestamp,
    isCurrent,
    tone: !hasTimestamp ? 'check' : isCurrent ? 'good' : 'watch',
  }
}

const getReadingHistory = (
  samples: Gen2ReportSample[],
  expectedPackageCount: number | null,
  historyWindowKey: HistoryWindowKey,
): HostedGen2ReadingHistory => {
  const coveragePercent =
    expectedPackageCount === null ? null : (samples.length / expectedPackageCount) * 100
  const largestGapMs = getLargestGapMsFromTimestamps(
    samples.map((sample) => sample.measuredAtMs),
  )
  const hasCoverageWarning =
    coveragePercent !== null && coveragePercent < COVERAGE_WARNING_THRESHOLD_PERCENT
  const hasGapWarning =
    largestGapMs !== null &&
    largestGapMs > FRESHNESS_THRESHOLD_MS &&
    (historyWindowKey === '3h' ||
      historyWindowKey === '6h' ||
      historyWindowKey === '12h' ||
      historyWindowKey === '24h' ||
      historyWindowKey === '7d')

  return {
    packageCount: samples.length,
    expectedPackageCount,
    coveragePercent,
    largestGapMs,
    hasCoverageWarning,
    hasGapWarning,
    tone:
      samples.length === 0
        ? 'check'
        : hasCoverageWarning || hasGapWarning
          ? 'watch'
          : 'good',
  }
}

const getMatchedCatalogEntries = (
  sample: Gen2ReportSample,
  descriptors: readonly HostedGen2CardCatalogDescriptor[],
): MatchedCatalogEntry[] =>
  descriptors.map((descriptor) => {
    const normalMatch = sample.rows.find(
      (row) =>
        row.measured_at === sample.measuredAt && doesHostedGen2RowMatchCard(row, descriptor),
    )
    const profileNotInstalledMatch = normalMatch
      ? undefined
      : sample.rows.find(
          (row) =>
            row.measured_at === sample.measuredAt &&
            normalizeHostedGen2ComparisonText(row.sensor_key) ===
              normalizeHostedGen2ComparisonText(descriptor.sensorKey) &&
            getHostedGen2CanonicalMeasurementIdentity(row) ===
              normalizeHostedGen2ComparisonText(descriptor.canonicalMeasurementName) &&
            isExpectedNotInstalledRow(row),
        )
    const row = normalMatch ?? profileNotInstalledMatch ?? null

    return {
      descriptor,
      row,
      profileNotInstalled: row ? isExpectedNotInstalledRow(row) : false,
    }
  })

const getExpectedPhysicalIdentity = (descriptor: HostedGen2CardCatalogDescriptor): string =>
  normalizeHostedGen2ComparisonText(descriptor.physicalSensorId ?? descriptor.sensorKey)

const getSensorAvailability = (
  entries: MatchedCatalogEntry[],
  hasLatestSample: boolean,
  descriptors: readonly HostedGen2CardCatalogDescriptor[],
): HostedGen2SensorAvailability => {
  const expectedPhysicalIdentities = new Set(
    descriptors.map(getExpectedPhysicalIdentity),
  )
  const representedPhysicalIdentities = new Set(
    entries
      .filter((entry) => entry.row && !entry.profileNotInstalled)
      .map((entry) => getExpectedPhysicalIdentity(entry.descriptor)),
  )
  const reportedEntryCount = entries.filter((entry) => entry.row).length
  const profileNotInstalledEntryCount = entries.filter(
    (entry) => entry.profileNotInstalled,
  ).length
  const absentEntryLabels = entries
    .filter((entry) => !entry.row)
    .map((entry) => entry.descriptor.label)

  return {
    expectedEntryCount: descriptors.length,
    reportedEntryCount,
    absentEntryCount: descriptors.length - reportedEntryCount,
    expectedPhysicalSensorCount: expectedPhysicalIdentities.size,
    representedPhysicalSensorCount: representedPhysicalIdentities.size,
    profileNotInstalledEntryCount,
    absentEntryLabels,
    tone:
      !hasLatestSample
        ? 'check'
        : absentEntryLabels.length > 0 ||
            representedPhysicalIdentities.size + getNotInstalledPhysicalCount(entries) <
              expectedPhysicalIdentities.size
          ? 'watch'
          : 'good',
  }
}

const getLatestSampleQuality = (
  entries: MatchedCatalogEntry[],
  hasLatestSample: boolean,
  expectedEntryCount: number,
): HostedGen2LatestReadingChecks => {
  const matchedEntries = entries.filter((entry) => entry.row)
  const evaluatedEntries = matchedEntries.filter((entry) => !entry.profileNotInstalled)
  const invalidEntries = evaluatedEntries.filter((entry) => entry.row?.valid === false)
  const qualityWarningEntries = evaluatedEntries.filter((entry) =>
    hasQualityMetadataWarning(entry.row?.quality),
  )
  const missingValueEntries = evaluatedEntries.filter(
    (entry) => !isFiniteMeasurementValue(entry.row),
  )
  const sensorNotDetectedEntries = evaluatedEntries.filter((entry) =>
    isSensorNotDetectedRow(entry.row),
  )
  const usableEntries = evaluatedEntries.filter((entry) => isUsableExpectedRow(entry.row))
  const reasons = Array.from(
    new Set(
      evaluatedEntries
        .map((entry) => entry.row?.reason?.trim())
        .filter((reason): reason is string => Boolean(reason)),
    ),
  )
  const absentEntryCount = entries.filter((entry) => !entry.row).length
  const hasReviewEvidence =
    absentEntryCount > 0 ||
    invalidEntries.length > 0 ||
    qualityWarningEntries.length > 0 ||
    missingValueEntries.length > 0 ||
    sensorNotDetectedEntries.length > 0 ||
    (evaluatedEntries.length > 0 && usableEntries.length === 0)

  return {
    expectedEntryCount,
    matchedEntryCount: matchedEntries.length,
    usableEntryCount: usableEntries.length,
    invalidEntryCount: invalidEntries.length,
    qualityWarningEntryCount: qualityWarningEntries.length,
    missingValueEntryCount: missingValueEntries.length,
    sensorNotDetectedEntryCount: sensorNotDetectedEntries.length,
    profileNotInstalledEntryCount: matchedEntries.filter((entry) => entry.profileNotInstalled).length,
    absentEntryCount,
    reasons,
    tone: !hasLatestSample ? 'check' : hasReviewEvidence ? 'watch' : 'good',
  }
}

const getAttentionItems = ({
  rows,
  latestSample,
  readingAge,
  readingHistory,
  sensorAvailability,
  latestReadingChecks,
  matchedEntries,
}: {
  rows: HostedGen2MeasurementRow[]
  latestSample: Gen2ReportSample | null
  readingAge: HostedGen2ReadingAge
  readingHistory: HostedGen2ReadingHistory
  sensorAvailability: HostedGen2SensorAvailability
  latestReadingChecks: HostedGen2LatestReadingChecks
  matchedEntries: MatchedCatalogEntry[]
}): HostedGen2AttentionItem[] => {
  const items: HostedGen2AttentionItem[] = []
  const add = (key: string, message: string) => items.push({ key, message })

  if (rows.length === 0) add('no-history', 'No measurement history was returned for this device and window.')
  else if (!latestSample) add('no-timestamp', 'Returned garden readings have no parseable reading time.')
  if (readingAge.latestAgeMs !== null && readingAge.latestAgeMs < 0) {
    add(
      'future-timestamp',
      'The latest reading time is later than the current dashboard time.',
    )
  } else if (
    readingAge.latestAgeMs !== null &&
    readingAge.latestAgeMs > FRESHNESS_THRESHOLD_MS
  ) {
    add('not-current', 'The latest reading is older than 45 minutes.')
  }
  if (latestSample && sensorAvailability.absentEntryCount > 0) {
    add('absent-entries', `Expected readings not reported: ${sensorAvailability.absentEntryLabels.join(', ')}.`)
  }

  const expectedInstalledPhysicalCount =
    sensorAvailability.expectedPhysicalSensorCount - getNotInstalledPhysicalCount(matchedEntries)
  if (
    latestSample &&
    sensorAvailability.representedPhysicalSensorCount < expectedInstalledPhysicalCount
  ) {
    add(
      'physical-sensors',
      `${sensorAvailability.representedPhysicalSensorCount} of ${expectedInstalledPhysicalCount} expected installed physical sensors are represented.`,
    )
  }
  if (readingHistory.hasCoverageWarning) {
    add('coverage', 'The selected window contains less than 70% of the expected reading updates.')
  }
  if (readingHistory.hasGapWarning) {
    add('gap', 'The selected window contains a gap between reading updates longer than 45 minutes.')
  }
  if (latestReadingChecks.invalidEntryCount > 0) {
    add('invalid', `${latestReadingChecks.invalidEntryCount} expected latest readings report valid as false.`)
  }
  if (latestReadingChecks.qualityWarningEntryCount > 0) {
    add('quality', `${latestReadingChecks.qualityWarningEntryCount} expected latest readings report quality metadata requiring review.`)
  }
  if (latestReadingChecks.missingValueEntryCount > 0) {
    add('missing-values', `${latestReadingChecks.missingValueEntryCount} expected latest readings have no finite numeric value.`)
  }
  if (latestReadingChecks.sensorNotDetectedEntryCount > 0) {
    add('not-detected', `${latestReadingChecks.sensorNotDetectedEntryCount} expected installed sensors report explicit not-detected evidence.`)
  }
  if (
    latestSample &&
    latestReadingChecks.matchedEntryCount > latestReadingChecks.profileNotInstalledEntryCount &&
    latestReadingChecks.usableEntryCount === 0
  ) {
    add('no-usable', 'The latest reading update contains no usable expected readings.')
  }

  return items
}

const getNotInstalledPhysicalCount = (entries: MatchedCatalogEntry[]): number =>
  new Set(
    entries
      .filter((entry) => entry.profileNotInstalled)
      .map((entry) => getExpectedPhysicalIdentity(entry.descriptor)),
  ).size

const isExpectedNotInstalledRow = (row: HostedGen2MeasurementRow): boolean => {
  const normalizedQuality = normalizeHostedGen2ComparisonText(row.quality)

  return (
    (normalizedQuality === 'not_installed' || normalizedQuality === 'not installed') &&
    normalizeHostedGen2ComparisonText(row.reason) === 'profile_not_installed' &&
    row.valid === false &&
    row.measurement_value === null
  )
}

const hasQualityMetadataWarning = (quality: string | null | undefined): boolean => {
  const normalizedQuality = normalizeHostedGen2ComparisonText(quality)
  return !normalizedQuality || !QUALITY_VALUES_WITHOUT_WARNINGS.has(normalizedQuality)
}

const isFiniteMeasurementValue = (
  row: HostedGen2MeasurementRow | null | undefined,
): boolean =>
  typeof row?.measurement_value === 'number' && Number.isFinite(row.measurement_value)

const isUsableExpectedRow = (
  row: HostedGen2MeasurementRow | null | undefined,
): boolean =>
  Boolean(
    row &&
      row.valid !== false &&
      isFiniteMeasurementValue(row) &&
      !hasQualityMetadataWarning(row.quality),
  )

const isSensorNotDetectedRow = (
  row: HostedGen2MeasurementRow | null | undefined,
): boolean => normalizeHostedGen2ComparisonText(row?.reason).includes('not_detected')
