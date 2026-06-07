import type {
  HostedGen2MeasurementStatus,
  HostedGen2MeasurementStatusLevel,
} from './hostedGen2Display'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

export type HostedMeasurementTrustLevel =
  | 'good'
  | 'watch'
  | 'check'
  | 'failed'
  | 'unavailable'
  | 'insufficient-data'
  | 'neutral'

export type HostedMeasurementTrustResult = {
  level: HostedMeasurementTrustLevel
  label: string
  headlineReason: string
  detailReason: string
  trustFlags: string[]
}

type MeasurementKind =
  | 'relative_humidity'
  | 'air_temperature'
  | 'soil_temperature'
  | 'barometric_pressure'
  | 'moisture_index'
  | 'raw_adc'
  | 'ambient_light'
  | 'unknown'

type TrustInput = {
  row: HostedGen2MeasurementRow | undefined
  rows: HostedGen2MeasurementRow[]
  fallbackStatus: HostedGen2MeasurementStatus
}

type UsableSample = {
  measuredAtMs: number
  value: number
}

type HardBounds = {
  min: number
  max: number
}

type RecentBehaviorConfig = {
  rateThresholdPer15Minutes?: number
  rollingOutlierThreshold?: number
}

const MIN_RECENT_SAMPLES = 6
const RATE_MIN_INTERVAL_MS = 5 * 60 * 1000
const RATE_MAX_INTERVAL_MS = 30 * 60 * 1000
const RATE_NORMALIZATION_INTERVAL_MS = 15 * 60 * 1000
const RECENT_SAMPLE_LIMIT = 12
const REPEATED_RATE_CHANGE_COUNT = 2

const UNAVAILABLE_QUALITY_VALUES = new Set(['missing', 'disabled', 'not_installed', 'not installed'])
const FAILED_QUALITY_VALUES = new Set(['failed'])

const HARD_BOUNDS_BY_KIND: Partial<Record<MeasurementKind, HardBounds>> = {
  relative_humidity: { min: 0, max: 100 },
  air_temperature: { min: -40, max: 140 },
  soil_temperature: { min: 20, max: 120 },
  barometric_pressure: { min: 850, max: 1100 },
  moisture_index: { min: 0, max: 100 },
  raw_adc: { min: 0, max: 4095 },
}

const RECENT_BEHAVIOR_CONFIG_BY_KIND: Partial<Record<MeasurementKind, RecentBehaviorConfig>> = {
  relative_humidity: {
    rateThresholdPer15Minutes: 25,
    rollingOutlierThreshold: 35,
  },
  air_temperature: {
    rateThresholdPer15Minutes: 15,
    rollingOutlierThreshold: 20,
  },
  soil_temperature: {
    rateThresholdPer15Minutes: 8,
    rollingOutlierThreshold: 12,
  },
  moisture_index: {
    rateThresholdPer15Minutes: 30,
    rollingOutlierThreshold: 35,
  },
  barometric_pressure: {
    rollingOutlierThreshold: 25,
  },
}

const FALLBACK_LABELS: Record<HostedGen2MeasurementStatusLevel, string> = {
  good: 'Good',
  watch: 'Watch',
  check: 'Check',
  neutral: 'Neutral',
}

export const getHostedMeasurementTrust = ({
  row,
  rows,
  fallbackStatus,
}: TrustInput): HostedMeasurementTrustResult => {
  if (!row) {
    return buildTrustResult({
      level: 'unavailable',
      label: 'Unavailable',
      headlineReason: 'No displayable recent value is available for this measurement.',
      detailReason: 'No latest garden reading was available for this measurement card.',
      trustFlags: ['missing-row'],
    })
  }

  const normalizedQuality = normalizeText(row.quality)

  if (row.valid === false || FAILED_QUALITY_VALUES.has(normalizedQuality)) {
    return buildTrustResult({
      level: 'failed',
      label: 'Failed',
      headlineReason: 'Sensor metadata reports this measurement as failed or invalid.',
      detailReason: formatMetadataDetail(row),
      trustFlags: ['metadata-failure'],
    })
  }

  if (UNAVAILABLE_QUALITY_VALUES.has(normalizedQuality)) {
    return buildTrustResult({
      level: 'unavailable',
      label: 'Unavailable',
      headlineReason: 'This measurement is not currently available from the device.',
      detailReason: formatMetadataDetail(row),
      trustFlags: ['metadata-unavailable'],
    })
  }

  if (!isFiniteMeasurementValue(row.measurement_value)) {
    return buildTrustResult({
      level: 'failed',
      label: 'Failed',
      headlineReason: 'The reported value is not a usable numeric measurement.',
      detailReason: 'The latest garden reading did not include a finite numeric measurement value.',
      trustFlags: ['non-finite-value'],
    })
  }

  const measurementKind = getMeasurementKind(row)
  const hardBounds = HARD_BOUNDS_BY_KIND[measurementKind]

  if (hardBounds && !isWithinBounds(row.measurement_value, hardBounds)) {
    return buildTrustResult({
      level: 'check',
      label: 'Check',
      headlineReason: 'Reading is outside physical plausibility bounds.',
      detailReason: `Expected hard bounds for this display check are ${hardBounds.min} to ${hardBounds.max}.`,
      trustFlags: ['outside-hard-bounds'],
    })
  }

  const recentBehaviorConfig = RECENT_BEHAVIOR_CONFIG_BY_KIND[measurementKind]

  if (!recentBehaviorConfig) {
    return getFallbackTrustResult(fallbackStatus, measurementKind)
  }

  const usableSamples = getUsableSamplesForIdentity(row, rows)

  if (usableSamples.length < MIN_RECENT_SAMPLES) {
    return buildTrustResult({
      level: 'insufficient-data',
      label: 'Insufficient Data',
      headlineReason:
        'Not enough recent samples exist yet to judge this measurement against its own recent behavior.',
      detailReason: `${usableSamples.length} usable recent samples found; ${MIN_RECENT_SAMPLES} are needed before recent-behavior checks run.`,
      trustFlags: ['insufficient-samples'],
    })
  }

  const rapidChangeEvents = recentBehaviorConfig?.rateThresholdPer15Minutes
    ? getRapidChangeEvents(usableSamples, recentBehaviorConfig.rateThresholdPer15Minutes)
    : 0

  if (rapidChangeEvents >= REPEATED_RATE_CHANGE_COUNT) {
    return buildTrustResult({
      level: 'check',
      label: 'Check',
      headlineReason:
        'Reading repeatedly changed faster than expected compared with recent samples.',
      detailReason:
        'Recent samples for this exact measurement identity crossed the rate-of-change threshold more than once.',
      trustFlags: ['repeated-rapid-change'],
    })
  }

  const latestSample = usableSamples[usableSamples.length - 1]
  const isRollingOutlier =
    Boolean(recentBehaviorConfig?.rollingOutlierThreshold) &&
    isOutlierAgainstRecentMedian(
      latestSample.value,
      usableSamples.slice(0, -1),
      recentBehaviorConfig?.rollingOutlierThreshold ?? Number.POSITIVE_INFINITY,
    )

  if (isRollingOutlier && rapidChangeEvents > 0) {
    return buildTrustResult({
      level: 'check',
      label: 'Check',
      headlineReason: "Reading does not match this measurement's recent behavior.",
      detailReason:
        'The latest value is far from its recent median and also changed quickly from a recent sample.',
      trustFlags: ['rolling-outlier', 'rapid-change'],
    })
  }

  if (rapidChangeEvents > 0) {
    return buildTrustResult({
      level: 'watch',
      label: 'Watch',
      headlineReason: 'Reading changed faster than expected compared with recent samples.',
      detailReason:
        'The latest or recent same-identity sample crossed the rate-of-change threshold.',
      trustFlags: ['rapid-change'],
    })
  }

  if (isRollingOutlier) {
    return buildTrustResult({
      level: 'watch',
      label: 'Watch',
      headlineReason: "Reading does not match this measurement's recent behavior.",
      detailReason: 'The latest value is far from the recent median for this measurement identity.',
      trustFlags: ['rolling-outlier'],
    })
  }

  return getFallbackTrustResult(fallbackStatus, measurementKind)
}

const getFallbackTrustResult = (
  fallbackStatus: HostedGen2MeasurementStatus,
  measurementKind: MeasurementKind,
): HostedMeasurementTrustResult => {
  const level = getFallbackTrustLevel(fallbackStatus.level, measurementKind)
  const label = level === 'neutral' ? FALLBACK_LABELS.neutral : fallbackStatus.label || FALLBACK_LABELS[fallbackStatus.level]
  const isCaution = level === 'watch' || level === 'check'
  const headlineReason =
    fallbackStatus.reason ??
    (isCaution
      ? 'Reading is displayable, but the latest value still needs review.'
      : 'Reading is displayable and passed dashboard quality checks.')

  return buildTrustResult({
    level,
    label,
    headlineReason,
    detailReason:
      'Dashboard quality checks did not find metadata failure, hard-bound failure, or recent-behavior concerns.',
    trustFlags: ['display-status-fallback'],
  })
}

const getFallbackTrustLevel = (
  fallbackLevel: HostedGen2MeasurementStatusLevel,
  measurementKind: MeasurementKind,
): HostedMeasurementTrustLevel => {
  if (measurementKind === 'raw_adc' && fallbackLevel === 'good') {
    return 'neutral'
  }

  return fallbackLevel
}

const getUsableSamplesForIdentity = (
  latestRow: HostedGen2MeasurementRow,
  rows: HostedGen2MeasurementRow[],
): UsableSample[] => {
  const identity = getMeasurementIdentity(latestRow)

  return rows
    .filter((row) => getMeasurementIdentity(row) === identity)
    .filter((row) => row.valid !== false)
    .filter((row) => !UNAVAILABLE_QUALITY_VALUES.has(normalizeText(row.quality)))
    .filter((row) => !FAILED_QUALITY_VALUES.has(normalizeText(row.quality)))
    .map((row) => ({
      measuredAtMs: new Date(row.measured_at).getTime(),
      value: row.measurement_value,
    }))
    .filter(
      (sample): sample is UsableSample =>
        Number.isFinite(sample.measuredAtMs) && isFiniteMeasurementValue(sample.value),
    )
    .sort((left, right) => left.measuredAtMs - right.measuredAtMs)
    .slice(-RECENT_SAMPLE_LIMIT)
}

const getRapidChangeEvents = (
  samples: UsableSample[],
  thresholdPer15Minutes: number,
): number => {
  let eventCount = 0

  for (let index = 1; index < samples.length; index += 1) {
    const previousSample = samples[index - 1]
    const currentSample = samples[index]
    const intervalMs = currentSample.measuredAtMs - previousSample.measuredAtMs

    if (intervalMs < RATE_MIN_INTERVAL_MS || intervalMs > RATE_MAX_INTERVAL_MS) {
      continue
    }

    const normalizedChange =
      Math.abs(currentSample.value - previousSample.value) *
      (RATE_NORMALIZATION_INTERVAL_MS / intervalMs)

    if (normalizedChange > thresholdPer15Minutes) {
      eventCount += 1
    }
  }

  return eventCount
}

const isOutlierAgainstRecentMedian = (
  latestValue: number,
  priorSamples: UsableSample[],
  absoluteThreshold: number,
): boolean => {
  if (priorSamples.length < MIN_RECENT_SAMPLES - 1) {
    return false
  }

  const recentValues = priorSamples.slice(-(MIN_RECENT_SAMPLES - 1)).map((sample) => sample.value)
  const median = getMedian(recentValues)
  const absoluteDeviation = Math.abs(latestValue - median)
  const deviations = recentValues.map((value) => Math.abs(value - median))
  const medianAbsoluteDeviation = getMedian(deviations)
  const madThreshold = medianAbsoluteDeviation > 0 ? medianAbsoluteDeviation * 6 : 0

  return absoluteDeviation > Math.max(absoluteThreshold, madThreshold)
}

const getMeasurementKind = (row: HostedGen2MeasurementRow): MeasurementKind => {
  const measurementName = normalizeText(row.measurement_name)
  const sensorType = normalizeText(row.sensor_type)

  if (measurementName === 'relative_humidity') {
    return 'relative_humidity'
  }

  if (measurementName === 'air_temperature') {
    return 'air_temperature'
  }

  if (measurementName === 'temperature') {
    return sensorType.includes('ds18b20') ? 'soil_temperature' : 'air_temperature'
  }

  if (measurementName === 'barometric_pressure') {
    return 'barometric_pressure'
  }

  if (measurementName === 'moisture_index') {
    return 'moisture_index'
  }

  if (measurementName === 'raw_adc') {
    return 'raw_adc'
  }

  if (measurementName === 'ambient_light') {
    return 'ambient_light'
  }

  return 'unknown'
}

const getMeasurementIdentity = (row: HostedGen2MeasurementRow): string =>
  [
    row.device_id,
    normalizeText(row.sensor_key),
    normalizeText(row.measurement_name),
    normalizeText(row.measurement_unit),
  ].join('|')

const formatMetadataDetail = (row: HostedGen2MeasurementRow): string => {
  const details = [
    row.valid === false ? 'valid is No' : null,
    row.quality?.trim() ? `quality is ${row.quality.trim()}` : null,
    row.reason?.trim() ? `reason is ${row.reason.trim()}` : null,
  ].filter(Boolean)

  return details.length > 0
    ? `Device metadata evidence: ${details.join(', ')}.`
    : 'Device metadata did not mark this as a displayable good reading.'
}

const isWithinBounds = (value: number, bounds: HardBounds): boolean =>
  value >= bounds.min && value <= bounds.max

const isFiniteMeasurementValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const getMedian = (values: number[]): number => {
  const sortedValues = [...values].sort((left, right) => left - right)
  const midpoint = Math.floor(sortedValues.length / 2)

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2
  }

  return sortedValues[midpoint]
}

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? ''

const buildTrustResult = (result: HostedMeasurementTrustResult): HostedMeasurementTrustResult =>
  result
