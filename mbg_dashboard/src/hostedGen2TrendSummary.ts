import { FRESHNESS_THRESHOLD_MS } from './deviceStatusHealth'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

export type HostedGen2TrendDirection =
  | 'rising'
  | 'falling'
  | 'stable'
  | 'sparse'
  | 'stale'
  | 'not_enough_data'
  | 'not_trendable'

export type HostedGen2TrendSummary = {
  direction: HostedGen2TrendDirection
  label: string
  deltaLabel?: string
  sampleCount: number
  elapsedMinutes?: number
}

type UsableTrendSample = {
  measuredAtMs: number
  value: number
}

const MIN_USABLE_SAMPLE_COUNT = 3
const MIN_ELAPSED_MINUTES = 30
const MIN_ELAPSED_MS = MIN_ELAPSED_MINUTES * 60 * 1000
const UNUSABLE_QUALITY_VALUES = new Set([
  'failed',
  'missing',
  'disabled',
  'not_installed',
  'not installed',
  'unavailable',
])

export const getHostedGen2TrendSummary = (
  currentRow: HostedGen2MeasurementRow | undefined,
  rows: HostedGen2MeasurementRow[],
  now: Date = new Date(),
): HostedGen2TrendSummary => {
  if (!currentRow || !isUsableTrendRow(currentRow)) {
    return buildSummary('not_trendable', 0)
  }

  const samples = getUsableSamplesForIdentity(currentRow, rows)

  if (samples.length < MIN_USABLE_SAMPLE_COUNT) {
    return buildSummary('not_enough_data', samples.length)
  }

  const earliestSample = samples[0]
  const latestSample = samples[samples.length - 1]
  const latestAgeMs = now.getTime() - latestSample.measuredAtMs

  if (latestAgeMs > FRESHNESS_THRESHOLD_MS) {
    return buildSummary('stale', samples.length, getElapsedMinutes(earliestSample, latestSample))
  }

  const elapsedMs = latestSample.measuredAtMs - earliestSample.measuredAtMs
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / (60 * 1000)))

  if (elapsedMs < MIN_ELAPSED_MS) {
    return buildSummary('sparse', samples.length, elapsedMinutes)
  }

  const delta = latestSample.value - earliestSample.value
  const deadband = getDeadband(currentRow, earliestSample.value)
  const direction =
    Math.abs(delta) <= deadband ? 'stable' : delta > deadband ? 'rising' : 'falling'

  return {
    direction,
    label: TREND_LABELS[direction],
    deltaLabel: formatDeltaLabel(currentRow, delta, elapsedMinutes),
    sampleCount: samples.length,
    elapsedMinutes,
  }
}

const getUsableSamplesForIdentity = (
  currentRow: HostedGen2MeasurementRow,
  rows: HostedGen2MeasurementRow[],
): UsableTrendSample[] => {
  const identity = getMeasurementIdentity(currentRow)
  const samplesByMeasuredAt = new Map<string, UsableTrendSample>()

  rows.forEach((row) => {
    if (getMeasurementIdentity(row) !== identity || !isUsableTrendRow(row)) {
      return
    }

    if (samplesByMeasuredAt.has(row.measured_at)) {
      return
    }

    samplesByMeasuredAt.set(row.measured_at, {
      measuredAtMs: new Date(row.measured_at).getTime(),
      value: row.measurement_value,
    })
  })

  return Array.from(samplesByMeasuredAt.values()).sort(
    (left, right) => left.measuredAtMs - right.measuredAtMs,
  )
}

const isUsableTrendRow = (row: HostedGen2MeasurementRow): row is HostedGen2MeasurementRow & {
  measurement_value: number
} => {
  const measuredAtMs = new Date(row.measured_at).getTime()

  return (
    Number.isFinite(measuredAtMs) &&
    typeof row.measurement_value === 'number' &&
    Number.isFinite(row.measurement_value) &&
    row.valid !== false &&
    !UNUSABLE_QUALITY_VALUES.has(normalizeText(row.quality))
  )
}

const getMeasurementIdentity = (row: HostedGen2MeasurementRow): string =>
  [
    row.device_id,
    normalizeText(row.sensor_key),
    normalizeText(row.sensor_type),
    normalizeText(row.measurement_name),
    normalizeText(row.measurement_unit),
  ].join('|')

const getDeadband = (row: HostedGen2MeasurementRow, earliestValue: number): number => {
  const measurementName = normalizeText(row.measurement_name)
  const sensorType = normalizeText(row.sensor_type)

  if (
    measurementName === 'air_temperature' ||
    measurementName === 'temperature' ||
    sensorType.includes('ds18b20')
  ) {
    return 1
  }

  if (measurementName === 'relative_humidity') {
    return 3
  }

  if (measurementName === 'moisture_index') {
    return 3
  }

  if (measurementName === 'raw_adc') {
    return 75
  }

  if (measurementName === 'barometric_pressure') {
    return 1
  }

  if (measurementName === 'ambient_light') {
    return Math.max(10, Math.abs(earliestValue) * 0.1)
  }

  return Math.max(1, Math.abs(earliestValue) * 0.02)
}

const formatDeltaLabel = (
  row: HostedGen2MeasurementRow,
  delta: number,
  elapsedMinutes: number,
): string => {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${formatDeltaValue(row, delta)} ${getDeltaUnit(row)} over ${formatElapsed(elapsedMinutes)}`
}

const formatDeltaValue = (row: HostedGen2MeasurementRow, delta: number): string => {
  const measurementName = normalizeText(row.measurement_name)

  if (measurementName === 'moisture_index' || measurementName === 'raw_adc') {
    return delta.toLocaleString([], { maximumFractionDigits: 0 })
  }

  if (measurementName === 'ambient_light' && Math.abs(delta) >= 100) {
    return delta.toLocaleString([], { maximumFractionDigits: 0 })
  }

  return delta.toLocaleString([], { maximumFractionDigits: 1 })
}

const getDeltaUnit = (row: HostedGen2MeasurementRow): string => {
  const measurementName = normalizeText(row.measurement_name)

  if (measurementName === 'moisture_index') {
    return 'index'
  }

  if (measurementName === 'raw_adc') {
    return 'adc_count'
  }

  return row.measurement_unit?.trim() || 'value'
}

const formatElapsed = (elapsedMinutes: number): string => {
  if (elapsedMinutes < 60) {
    return `${Math.max(1, elapsedMinutes)}m`
  }

  const elapsedHours = elapsedMinutes / 60

  if (elapsedHours < 48) {
    return `${formatDurationNumber(elapsedHours)}h`
  }

  return `${formatDurationNumber(elapsedHours / 24)}d`
}

const formatDurationNumber = (value: number): string =>
  Number.isInteger(value)
    ? value.toLocaleString([], { maximumFractionDigits: 0 })
    : value.toLocaleString([], { maximumFractionDigits: 1 })

const getElapsedMinutes = (
  earliestSample: UsableTrendSample,
  latestSample: UsableTrendSample,
): number =>
  Math.max(
    0,
    Math.round((latestSample.measuredAtMs - earliestSample.measuredAtMs) / (60 * 1000)),
  )

const buildSummary = (
  direction: HostedGen2TrendDirection,
  sampleCount: number,
  elapsedMinutes?: number,
): HostedGen2TrendSummary => ({
  direction,
  label: TREND_LABELS[direction],
  sampleCount,
  elapsedMinutes,
})

const TREND_LABELS: Record<HostedGen2TrendDirection, string> = {
  rising: 'Rising',
  falling: 'Falling',
  stable: 'Stable',
  sparse: 'Sparse data',
  stale: 'Stale data',
  not_enough_data: 'Not enough data',
  not_trendable: 'Not trendable',
}

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? ''
