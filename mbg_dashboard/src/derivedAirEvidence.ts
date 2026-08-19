import {
  COMMISSIONED_ACTIONABLE_AGE_MS,
  COMMISSIONED_FRESHNESS_LIMIT_MS,
  type CommissionedEvidenceSeverity,
} from './commissionedEvidencePolicy.ts'
import {
  HOSTED_GEN2_CARD_CATALOG,
  normalizeHostedGen2ComparisonText,
  type HostedGen2CardCatalogDescriptor,
} from './hostedGen2Presentation.ts'
import { evaluateMeasurementPresentationEligibility } from './measurementPresentationEligibility.ts'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements.ts'

export type DerivedAirMetric = 'feels-like' | 'dew-point'
export type DerivedAirMethod = 'heat-index' | 'air-temperature-fallback' | 'dew-point'

export type DerivedAirFailureReason =
  | 'no-window-evidence'
  | 'batch-identity-missing'
  | 'required-source-absent'
  | 'device-mismatch'
  | 'batch-mismatch'
  | 'source-time-mismatch'
  | 'batch-provenance-mismatch'
  | 'ambiguous-source'
  | 'unit-mismatch'
  | 'source-invalid'
  | 'source-presentation-ineligible'

export type DerivedAirFormulaUnavailableReason =
  | 'humidity-not-positive'
  | 'temperature-above-heat-index-range'
  | 'dew-point-input-outside-range'
  | 'dew-point-result-outside-range'
  | 'calculation-non-finite'

export type DerivedAirPair = {
  batchId: string | null
  deviceId: string
  measuredAt: string
  measuredAtMs: number
  batchCreatedAt: string | null
  batchCreatedAtMs: number
  temperatureRow: HostedGen2MeasurementRow & { measurement_value: number }
  humidityRow: HostedGen2MeasurementRow & { measurement_value: number }
}

export type DerivedAirReading = {
  metric: DerivedAirMetric
  valueF: number
  roundedValueF: number
  method: DerivedAirMethod
  pair: DerivedAirPair
}

export type DerivedAirBatchEvaluation = {
  batchId: string | null
  measuredAt: string | null
  measuredAtMs: number
  batchCreatedAt: string | null
  batchCreatedAtMs: number
  rows: HostedGen2MeasurementRow[]
  pair: DerivedAirPair | null
  failureReason: DerivedAirFailureReason | null
}

export type DerivedAirFormulaResult =
  | { status: 'available'; valueF: number; method: DerivedAirMethod }
  | { status: 'unavailable'; reason: DerivedAirFormulaUnavailableReason }

export type DerivedAirEvidenceState =
  | 'current'
  | 'not-current'
  | 'last-good'
  | 'last-reliable'
  | 'above-supported-range'
  | 'unavailable'

export type DerivedAirMetricEvidence = {
  metric: DerivedAirMetric
  state: DerivedAirEvidenceState
  label: string
  detail: string | null
  severity: CommissionedEvidenceSeverity
  reading: DerivedAirReading | null
  latestEvaluation: DerivedAirBatchEvaluation | null
  latestFormulaResult: DerivedAirFormulaResult | null
  evidenceAgeMs: number | null
  failureCount: { count: number; isLowerBound: boolean }
}

const AIR_TEMPERATURE_DESCRIPTOR = getRequiredDescriptor('air-temperature')
const HUMIDITY_DESCRIPTOR = getRequiredDescriptor('humidity')
const DERIVED_SENSOR_KEY = 'derived_air_context'
const REQUIRED_SENSOR_TYPE = 'bme280'
const WMO_MINIMUM_C = -45
const WMO_MAXIMUM_C = 60
const WMO_MAGNUS_A = 17.62
const WMO_MAGNUS_B_C = 243.12
const HEAT_INDEX_MINIMUM_TEMPERATURE_F = 80
export const HEAT_INDEX_MAXIMUM_TEMPERATURE_F = 112

export const calculateFeelsLikeF = (
  temperatureF: number,
  relativeHumidityPercent: number,
): DerivedAirFormulaResult => {
  if (!areFinite(temperatureF, relativeHumidityPercent) || relativeHumidityPercent <= 0 || relativeHumidityPercent > 100) {
    return { status: 'unavailable', reason: relativeHumidityPercent <= 0 ? 'humidity-not-positive' : 'calculation-non-finite' }
  }
  if (temperatureF > HEAT_INDEX_MAXIMUM_TEMPERATURE_F) {
    return { status: 'unavailable', reason: 'temperature-above-heat-index-range' }
  }

  const simpleHeatIndex = 0.5 * (
    temperatureF + 61 + 1.2 * (temperatureF - 68) + 0.094 * relativeHumidityPercent
  )
  const screenedHeatIndex = (simpleHeatIndex + temperatureF) / 2

  if (temperatureF < HEAT_INDEX_MINIMUM_TEMPERATURE_F || screenedHeatIndex < 80) {
    return {
      status: 'available',
      valueF: temperatureF,
      method: 'air-temperature-fallback',
    }
  }

  let heatIndex =
    -42.379 +
    2.04901523 * temperatureF +
    10.14333127 * relativeHumidityPercent -
    0.22475541 * temperatureF * relativeHumidityPercent -
    0.00683783 * temperatureF * temperatureF -
    0.05481717 * relativeHumidityPercent * relativeHumidityPercent +
    0.00122874 * temperatureF * temperatureF * relativeHumidityPercent +
    0.00085282 * temperatureF * relativeHumidityPercent * relativeHumidityPercent -
    0.00000199 * temperatureF * temperatureF * relativeHumidityPercent * relativeHumidityPercent

  if (
    relativeHumidityPercent < 13 &&
    temperatureF >= 80 &&
    temperatureF <= 112
  ) {
    heatIndex -= ((13 - relativeHumidityPercent) / 4) *
      Math.sqrt((17 - Math.abs(temperatureF - 95)) / 17)
  } else if (
    relativeHumidityPercent > 85 &&
    temperatureF >= 80 &&
    temperatureF <= 87
  ) {
    heatIndex += ((relativeHumidityPercent - 85) / 10) * ((87 - temperatureF) / 5)
  }

  return Number.isFinite(heatIndex)
    ? { status: 'available', valueF: heatIndex, method: 'heat-index' }
    : { status: 'unavailable', reason: 'calculation-non-finite' }
}

export const calculateDewPointF = (
  temperatureF: number,
  relativeHumidityPercent: number,
): DerivedAirFormulaResult => {
  if (!areFinite(temperatureF, relativeHumidityPercent) || relativeHumidityPercent <= 0 || relativeHumidityPercent > 100) {
    return { status: 'unavailable', reason: relativeHumidityPercent <= 0 ? 'humidity-not-positive' : 'calculation-non-finite' }
  }

  const temperatureC = fahrenheitToCelsius(temperatureF)
  if (temperatureC < WMO_MINIMUM_C || temperatureC > WMO_MAXIMUM_C) {
    return { status: 'unavailable', reason: 'dew-point-input-outside-range' }
  }

  const gamma = Math.log(relativeHumidityPercent / 100) +
    (WMO_MAGNUS_A * temperatureC) / (WMO_MAGNUS_B_C + temperatureC)
  const dewPointC = (WMO_MAGNUS_B_C * gamma) / (WMO_MAGNUS_A - gamma)

  if (!Number.isFinite(dewPointC)) {
    return { status: 'unavailable', reason: 'calculation-non-finite' }
  }
  if (dewPointC < WMO_MINIMUM_C || dewPointC > WMO_MAXIMUM_C) {
    return { status: 'unavailable', reason: 'dew-point-result-outside-range' }
  }

  return { status: 'available', valueF: celsiusToFahrenheit(dewPointC), method: 'dew-point' }
}

export const buildDerivedAirBatchEvaluations = (
  rows: readonly HostedGen2MeasurementRow[],
): DerivedAirBatchEvaluation[] => {
  const groupedRows = new Map<string, HostedGen2MeasurementRow[]>()

  rows.forEach((row, rowIndex) => {
    const batchId = row.batch_id?.trim()
    const groupKey = batchId
      ? `batch:${batchId}`
      : buildBatchProvenanceKey(row) ?? `missing-batch:${rowIndex}`
    const batchRows = groupedRows.get(groupKey) ?? []
    batchRows.push(row)
    groupedRows.set(groupKey, batchRows)
  })

  const evaluations = [...groupedRows.values()]
    .map(evaluateBatch)
    .sort(compareEvaluationsNewestFirst)

  const rowsByTimestamp = new Map<string, HostedGen2MeasurementRow[]>()
  rows.forEach((row) => {
    const timestampRows = rowsByTimestamp.get(row.measured_at) ?? []
    timestampRows.push(row)
    rowsByTimestamp.set(row.measured_at, timestampRows)
  })

  return evaluations.map((evaluation) => {
    if (evaluation.failureReason !== 'required-source-absent' || !evaluation.measuredAt) {
      return evaluation
    }

    const timestampRows = rowsByTimestamp.get(evaluation.measuredAt) ?? []
    const temperatureRows = timestampRows.filter((row) =>
      isRequiredSourceRow(row, 'air_temperature'))
    const humidityRows = timestampRows.filter((row) =>
      isRequiredSourceRow(row, 'relative_humidity'))
    const hasSharedDevice = temperatureRows.some((temperatureRow) =>
      humidityRows.some((humidityRow) => humidityRow.device_id === temperatureRow.device_id))
    const temperatureBatchIds = getRelevantBatchIds(timestampRows, 'air_temperature')
    const humidityBatchIds = getRelevantBatchIds(timestampRows, 'relative_humidity')
    const hasSeparateSourceBatches = temperatureBatchIds.size > 0 && humidityBatchIds.size > 0 &&
      ![...temperatureBatchIds].some((batchId) => humidityBatchIds.has(batchId))

    if (temperatureRows.length > 0 && humidityRows.length > 0 && !hasSharedDevice) {
      return { ...evaluation, failureReason: 'device-mismatch' }
    }
    if (hasSeparateSourceBatches) return { ...evaluation, failureReason: 'batch-mismatch' }
    const hasSeparateStoredProvenance = temperatureRows.some((temperatureRow) =>
      humidityRows.some((humidityRow) =>
        humidityRow.device_id === temperatureRow.device_id &&
        normalizeNullableTimestamp(humidityRow.batch_created_at) !==
          normalizeNullableTimestamp(temperatureRow.batch_created_at)))
    if (hasSeparateStoredProvenance) {
      return { ...evaluation, failureReason: 'batch-provenance-mismatch' }
    }
    return evaluation
  })
}

export const getDerivedAirChartReadings = (
  rows: readonly HostedGen2MeasurementRow[],
  metric: DerivedAirMetric,
): DerivedAirReading[] => {
  const newestEvaluationByTimestamp = new Map<number, DerivedAirBatchEvaluation>()

  buildDerivedAirBatchEvaluations(rows).forEach((evaluation) => {
    if (!Number.isFinite(evaluation.measuredAtMs) || newestEvaluationByTimestamp.has(evaluation.measuredAtMs)) {
      return
    }
    newestEvaluationByTimestamp.set(evaluation.measuredAtMs, evaluation)
  })

  return [...newestEvaluationByTimestamp.values()]
    .flatMap((evaluation) => {
      if (!evaluation.pair) return []
      const formula = calculateMetric(metric, evaluation.pair)
      return formula.status === 'available'
        ? [buildReading(metric, evaluation.pair, formula)]
        : []
    })
    .sort((left, right) => left.pair.measuredAtMs - right.pair.measuredAtMs)
}

export const resolveDerivedAirMetricEvidence = ({
  rows,
  metric,
  deviceReportingActive,
  nowMs = Date.now(),
}: {
  rows: readonly HostedGen2MeasurementRow[]
  metric: DerivedAirMetric
  deviceReportingActive: boolean
  nowMs?: number
}): DerivedAirMetricEvidence => {
  const evaluations = buildDerivedAirBatchEvaluations(rows)
  const latestEvaluation = evaluations[0] ?? null

  if (!latestEvaluation) {
    return unavailableEvidence(metric, null, null, 'No Reading in Selected Window', null)
  }

  if (latestEvaluation.pair) {
    const latestFormulaResult = calculateMetric(metric, latestEvaluation.pair)
    if (latestFormulaResult.status === 'available') {
      const reading = buildReading(metric, latestEvaluation.pair, latestFormulaResult)
      return currentOrStaleEvidence(reading, latestEvaluation, latestFormulaResult, nowMs, deviceReportingActive)
    }

    if (
      metric === 'feels-like' &&
      latestFormulaResult.reason === 'temperature-above-heat-index-range'
    ) {
      return {
        metric,
        state: 'above-supported-range',
        label: 'Above supported range',
        detail: 'Air temperature is above the approved 112 °F Heat Index range.',
        severity: 'informational',
        reading: null,
        latestEvaluation,
        latestFormulaResult,
        evidenceAgeMs: getAgeMs(latestEvaluation.measuredAt, nowMs),
        failureCount: { count: 0, isLowerBound: false },
      }
    }

    if (
      latestFormulaResult.reason === 'dew-point-input-outside-range' ||
      latestFormulaResult.reason === 'dew-point-result-outside-range'
    ) {
      return unavailableEvidence(
        metric,
        latestEvaluation,
        latestFormulaResult,
        'Reading Unavailable',
        'Paired evidence is outside the approved dew-point formula range.',
      )
    }

    return recoverPriorReading({
      metric,
      evaluations,
      latestEvaluation,
      latestFormulaResult,
      recoveryState: 'last-reliable',
      detail: describeFormulaFailure(latestFormulaResult.reason),
      nowMs,
      deviceReportingActive,
    })
  }

  const recoveryState = latestEvaluation.failureReason === 'required-source-absent' ||
    latestEvaluation.failureReason === 'source-invalid'
    ? 'last-good'
    : 'last-reliable'

  return recoverPriorReading({
    metric,
    evaluations,
    latestEvaluation,
    latestFormulaResult: null,
    recoveryState,
    detail: describePairFailure(latestEvaluation.failureReason),
    nowMs,
    deviceReportingActive,
  })
}

export const toDerivedAirChartRow = (reading: DerivedAirReading): HostedGen2MeasurementRow => ({
  ...reading.pair.temperatureRow,
  batch_id: reading.pair.batchId,
  record_index: Math.max(
    reading.pair.temperatureRow.record_index,
    reading.pair.humidityRow.record_index,
  ),
  sensor_key: DERIVED_SENSOR_KEY,
  sensor_type: 'derived',
  physical_sensor_id: null,
  measurement_name: reading.metric === 'feels-like' ? 'feels_like' : 'dew_point',
  measurement_value: reading.valueF,
  measurement_unit: 'F',
  valid: true,
  quality: 'good',
  reason: `derived_${reading.method.replace(/-/g, '_')}`,
})

export const getDerivedAirChartMethodLabel = (value: unknown): string | null => {
  const normalized = normalizeHostedGen2ComparisonText(
    typeof value === 'string' ? value : null,
  )
  if (normalized === 'derived_heat_index' || normalized === 'heat index') return 'Heat Index'
  if (
    normalized === 'derived_air_temperature_fallback' ||
    normalized === 'air temperature fallback'
  ) return 'Air temperature fallback'
  if (normalized === 'derived_dew_point' || normalized === 'dew point') {
    return 'Dew Point calculation'
  }
  return null
}

export const roundDerivedAirValueF = (valueF: number): number =>
  Math.round((valueF + Number.EPSILON) * 10) / 10

const evaluateBatch = (rows: HostedGen2MeasurementRow[]): DerivedAirBatchEvaluation => {
  const batchId = rows[0]?.batch_id?.trim() || null
  const measuredAt = getNewestTimestampText(rows, 'measured_at')
  const batchCreatedAt = getNewestTimestampText(rows, 'batch_created_at')
  const base: Omit<DerivedAirBatchEvaluation, 'pair' | 'failureReason'> = {
    batchId,
    measuredAt,
    measuredAtMs: getTimestampMs(measuredAt),
    batchCreatedAt,
    batchCreatedAtMs: getTimestampMs(batchCreatedAt),
    rows: [...rows],
  }

  const temperatureRows = rows.filter((row) => isRequiredSourceRow(row, 'air_temperature'))
  const humidityRows = rows.filter((row) => isRequiredSourceRow(row, 'relative_humidity'))
  if (temperatureRows.length === 0 || humidityRows.length === 0) {
    return { ...base, pair: null, failureReason: 'required-source-absent' }
  }
  if (temperatureRows.length !== 1 || humidityRows.length !== 1) {
    return { ...base, pair: null, failureReason: 'ambiguous-source' }
  }

  const temperatureRow = temperatureRows[0]
  const humidityRow = humidityRows[0]
  if (temperatureRow.device_id !== humidityRow.device_id) {
    return { ...base, pair: null, failureReason: 'device-mismatch' }
  }
  if (temperatureRow.measured_at !== humidityRow.measured_at) {
    return { ...base, pair: null, failureReason: 'source-time-mismatch' }
  }
  if (!Number.isFinite(new Date(temperatureRow.measured_at).getTime())) {
    return { ...base, pair: null, failureReason: 'source-time-mismatch' }
  }
  if (
    normalizeNullableTimestamp(temperatureRow.batch_created_at) !==
    normalizeNullableTimestamp(humidityRow.batch_created_at)
  ) {
    return { ...base, pair: null, failureReason: 'batch-provenance-mismatch' }
  }
  if (
    temperatureRow.batch_created_at !== null &&
    !Number.isFinite(new Date(temperatureRow.batch_created_at).getTime())
  ) {
    return { ...base, pair: null, failureReason: 'batch-provenance-mismatch' }
  }
  if (!batchId && temperatureRow.batch_created_at === null) {
    return { ...base, pair: null, failureReason: 'batch-identity-missing' }
  }
  if (
    normalizeHostedGen2ComparisonText(temperatureRow.measurement_unit) !== 'f' ||
    normalizeHostedGen2ComparisonText(humidityRow.measurement_unit) !== '%'
  ) {
    return { ...base, pair: null, failureReason: 'unit-mismatch' }
  }

  const temperatureEligibility = evaluateMeasurementPresentationEligibility(
    AIR_TEMPERATURE_DESCRIPTOR,
    temperatureRow,
  )
  const humidityEligibility = evaluateMeasurementPresentationEligibility(
    HUMIDITY_DESCRIPTOR,
    humidityRow,
  )
  if (
    isInvalidEligibility(temperatureEligibility.classification) ||
    isInvalidEligibility(humidityEligibility.classification)
  ) {
    return { ...base, pair: null, failureReason: 'source-invalid' }
  }
  if (!temperatureEligibility.presentationEligible || !humidityEligibility.presentationEligible) {
    return { ...base, pair: null, failureReason: 'source-presentation-ineligible' }
  }
  if (!hasFiniteValue(temperatureRow) || !hasFiniteValue(humidityRow)) {
    return { ...base, pair: null, failureReason: 'source-invalid' }
  }

  const pair: DerivedAirPair = {
    batchId,
    deviceId: temperatureRow.device_id,
    measuredAt: temperatureRow.measured_at,
    measuredAtMs: getTimestampMs(temperatureRow.measured_at),
    batchCreatedAt: temperatureRow.batch_created_at,
    batchCreatedAtMs: getTimestampMs(temperatureRow.batch_created_at),
    temperatureRow,
    humidityRow,
  }
  return { ...base, measuredAt: pair.measuredAt, measuredAtMs: pair.measuredAtMs, pair, failureReason: null }
}

const recoverPriorReading = ({
  metric,
  evaluations,
  latestEvaluation,
  latestFormulaResult,
  recoveryState,
  detail,
  nowMs,
  deviceReportingActive,
}: {
  metric: DerivedAirMetric
  evaluations: DerivedAirBatchEvaluation[]
  latestEvaluation: DerivedAirBatchEvaluation
  latestFormulaResult: DerivedAirFormulaResult | null
  recoveryState: Extract<DerivedAirEvidenceState, 'last-good' | 'last-reliable'>
  detail: string
  nowMs: number
  deviceReportingActive: boolean
}): DerivedAirMetricEvidence => {
  const priorReading = evaluations.slice(1).flatMap((evaluation) => {
    if (!evaluation.pair) return []
    const formula = calculateMetric(metric, evaluation.pair)
    return formula.status === 'available' ? [buildReading(metric, evaluation.pair, formula)] : []
  })[0] ?? null

  if (!priorReading) {
    return unavailableEvidence(
      metric,
      latestEvaluation,
      latestFormulaResult,
      'Reading Unavailable',
      detail,
    )
  }

  const evidenceAgeMs = getAgeMs(priorReading.pair.measuredAt, nowMs)
  const failureCount = countConsecutiveMetricFailures(evaluations, metric)
  const failureSeverity = getFailureRunSeverity(
    failureCount.count,
    latestEvaluation.failureReason,
  )
  return {
    metric,
    state: recoveryState,
    label: recoveryState === 'last-good' ? 'Last Good' : 'Last Reliable',
    detail,
    severity: maxSeverity(
      getRecoverySeverity(evidenceAgeMs, deviceReportingActive),
      failureSeverity,
    ),
    reading: priorReading,
    latestEvaluation,
    latestFormulaResult,
    evidenceAgeMs,
    failureCount,
  }
}

const currentOrStaleEvidence = (
  reading: DerivedAirReading,
  latestEvaluation: DerivedAirBatchEvaluation,
  latestFormulaResult: DerivedAirFormulaResult,
  nowMs: number,
  deviceReportingActive: boolean,
): DerivedAirMetricEvidence => {
  const evidenceAgeMs = getAgeMs(reading.pair.measuredAt, nowMs)
  const current = evidenceAgeMs !== null && evidenceAgeMs >= 0 &&
    evidenceAgeMs <= COMMISSIONED_FRESHNESS_LIMIT_MS

  if (current) {
    const fallback = reading.method === 'air-temperature-fallback'
    return {
      metric: reading.metric,
      state: 'current',
      label: fallback ? 'Using air temperature' : reading.metric === 'feels-like' ? 'Heat Index' : 'Calculated',
      detail: fallback ? 'Heat Index does not apply under these conditions.' : null,
      severity: 'neutral',
      reading,
      latestEvaluation,
      latestFormulaResult,
      evidenceAgeMs,
      failureCount: { count: 0, isLowerBound: false },
    }
  }

  return {
    metric: reading.metric,
    state: 'not-current',
    label: deviceReportingActive && evidenceAgeMs !== null && evidenceAgeMs > COMMISSIONED_ACTIONABLE_AGE_MS
      ? 'Check Sensor'
      : 'Not Current',
    detail: deviceReportingActive ? null : 'Device reporting unavailable',
    severity: deviceReportingActive && evidenceAgeMs !== null && evidenceAgeMs > COMMISSIONED_ACTIONABLE_AGE_MS
      ? 'actionable'
      : 'caution',
    reading,
    latestEvaluation,
    latestFormulaResult,
    evidenceAgeMs,
    failureCount: { count: 0, isLowerBound: false },
  }
}

const unavailableEvidence = (
  metric: DerivedAirMetric,
  latestEvaluation: DerivedAirBatchEvaluation | null,
  latestFormulaResult: DerivedAirFormulaResult | null,
  label: string,
  detail: string | null,
): DerivedAirMetricEvidence => ({
  metric,
  state: 'unavailable',
  label,
  detail,
  severity: 'neutral',
  reading: null,
  latestEvaluation,
  latestFormulaResult,
  evidenceAgeMs: null,
  failureCount: {
    count: latestEvaluation ? 1 : 0,
    isLowerBound: false,
  },
})

const calculateMetric = (
  metric: DerivedAirMetric,
  pair: DerivedAirPair,
): DerivedAirFormulaResult => metric === 'feels-like'
  ? calculateFeelsLikeF(pair.temperatureRow.measurement_value, pair.humidityRow.measurement_value)
  : calculateDewPointF(pair.temperatureRow.measurement_value, pair.humidityRow.measurement_value)

const buildReading = (
  metric: DerivedAirMetric,
  pair: DerivedAirPair,
  formula: Extract<DerivedAirFormulaResult, { status: 'available' }>,
): DerivedAirReading => ({
  metric,
  valueF: formula.valueF,
  roundedValueF: roundDerivedAirValueF(formula.valueF),
  method: formula.method,
  pair,
})

const describePairFailure = (reason: DerivedAirFailureReason | null): string => {
  switch (reason) {
    case 'batch-identity-missing':
      return 'Exact source batch identity is unavailable.'
    case 'required-source-absent':
      return 'Required air temperature or humidity is missing from the latest batch.'
    case 'device-mismatch':
      return 'Air temperature and humidity belong to different devices.'
    case 'batch-mismatch':
      return 'Air temperature and humidity belong to different batches.'
    case 'source-time-mismatch':
      return 'Air temperature and humidity have different source times.'
    case 'batch-provenance-mismatch':
      return 'Paired source rows disagree about when their batch was stored.'
    case 'ambiguous-source':
      return 'The latest batch contains ambiguous air temperature or humidity evidence.'
    case 'unit-mismatch':
      return 'Source units do not match the approved °F and % calculation contract.'
    case 'source-invalid':
      return 'Latest paired source evidence is invalid.'
    case 'source-presentation-ineligible':
      return 'Latest paired source evidence is outside the approved presentation range.'
    default:
      return 'A trustworthy paired source reading is unavailable.'
  }
}

const describeFormulaFailure = (reason: DerivedAirFormulaUnavailableReason): string => {
  switch (reason) {
    case 'humidity-not-positive':
      return 'Relative humidity must be greater than 0% for a derived value.'
    case 'calculation-non-finite':
      return 'The derived calculation did not produce a finite value.'
    default:
      return 'The paired evidence is outside the approved formula domain.'
  }
}

const compareEvaluationsNewestFirst = (
  left: DerivedAirBatchEvaluation,
  right: DerivedAirBatchEvaluation,
): number => {
  if (left.measuredAtMs !== right.measuredAtMs) return right.measuredAtMs - left.measuredAtMs
  if (left.batchCreatedAtMs !== right.batchCreatedAtMs) {
    return right.batchCreatedAtMs - left.batchCreatedAtMs
  }
  return (right.batchId ?? '').localeCompare(left.batchId ?? '')
}

const getRelevantBatchIds = (
  rows: readonly HostedGen2MeasurementRow[],
  measurementName: 'air_temperature' | 'relative_humidity',
): Set<string> => new Set(rows
  .filter((row) => isRequiredSourceRow(row, measurementName))
  .map((row) => row.batch_id?.trim() ?? '')
  .filter(Boolean))

const buildBatchProvenanceKey = (row: HostedGen2MeasurementRow): string | null => {
  const deviceId = row.device_id.trim()
  const measuredAt = row.measured_at
  const batchCreatedAt = row.batch_created_at
  if (!deviceId || !measuredAt) return null

  return `provenance:${JSON.stringify([deviceId, measuredAt, batchCreatedAt ?? null])}`
}

const isRequiredSourceRow = (
  row: HostedGen2MeasurementRow,
  measurementName: 'air_temperature' | 'relative_humidity',
): boolean => normalizeHostedGen2ComparisonText(row.sensor_key) === 'bme280_air' &&
  normalizeHostedGen2ComparisonText(row.sensor_type) === REQUIRED_SENSOR_TYPE &&
  normalizeHostedGen2ComparisonText(row.measurement_name) === measurementName

const isInvalidEligibility = (classification: string): boolean =>
  classification === 'device-metadata-unusable' || classification === 'non-finite'

const hasFiniteValue = (
  row: HostedGen2MeasurementRow,
): row is HostedGen2MeasurementRow & { measurement_value: number } =>
  typeof row.measurement_value === 'number' && Number.isFinite(row.measurement_value)

function getRequiredDescriptor(key: string): HostedGen2CardCatalogDescriptor {
  const descriptor = HOSTED_GEN2_CARD_CATALOG.find((candidate) => candidate.key === key)
  if (!descriptor) throw new Error(`Missing required hosted Gen2 descriptor: ${key}`)
  return descriptor
}

const getNewestTimestampText = (
  rows: readonly HostedGen2MeasurementRow[],
  field: 'measured_at' | 'batch_created_at',
): string | null => rows.reduce<string | null>((newest, row) => {
  const candidate = row[field]
  return getTimestampMs(candidate) > getTimestampMs(newest) ? candidate : newest
}, null)

const getTimestampMs = (value: string | null | undefined): number => {
  const timestampMs = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(timestampMs) ? timestampMs : Number.NEGATIVE_INFINITY
}

const getAgeMs = (value: string | null | undefined, nowMs: number): number | null => {
  const timestampMs = getTimestampMs(value)
  return Number.isFinite(timestampMs) ? nowMs - timestampMs : null
}

const getRecoverySeverity = (
  ageMs: number | null,
  deviceReportingActive: boolean,
): CommissionedEvidenceSeverity => {
  if (ageMs === null || ageMs < 0) return 'caution'
  if (deviceReportingActive && ageMs > COMMISSIONED_ACTIONABLE_AGE_MS) return 'actionable'
  if (ageMs > COMMISSIONED_FRESHNESS_LIMIT_MS) return 'caution'
  return 'informational'
}

const countConsecutiveMetricFailures = (
  evaluations: readonly DerivedAirBatchEvaluation[],
  metric: DerivedAirMetric,
): { count: number; isLowerBound: boolean } => {
  let count = 0
  for (const evaluation of evaluations) {
    if (evaluation.pair) {
      const formula = calculateMetric(metric, evaluation.pair)
      if (formula.status === 'available') break
    }
    count += 1
  }
  return { count, isLowerBound: count > 0 && count === evaluations.length }
}

const getFailureRunSeverity = (
  count: number,
  reason: DerivedAirFailureReason | null,
): CommissionedEvidenceSeverity => {
  const cautionThreshold = reason === 'required-source-absent' ? 3 : 2
  return count >= cautionThreshold ? 'caution' : 'informational'
}

const SEVERITY_ORDER: readonly CommissionedEvidenceSeverity[] = [
  'neutral', 'informational', 'caution', 'actionable',
]

const maxSeverity = (
  left: CommissionedEvidenceSeverity,
  right: CommissionedEvidenceSeverity,
): CommissionedEvidenceSeverity => SEVERITY_ORDER.indexOf(left) >= SEVERITY_ORDER.indexOf(right)
  ? left
  : right

const normalizeNullableTimestamp = (value: string | null): string => value ?? ''
const fahrenheitToCelsius = (valueF: number): number => (valueF - 32) * 5 / 9
const celsiusToFahrenheit = (valueC: number): number => valueC * 9 / 5 + 32
const areFinite = (...values: number[]): boolean => values.every(Number.isFinite)
