import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildDerivedAirBatchEvaluations,
  calculateDewPointF,
  calculateFeelsLikeF,
  getDerivedAirChartMethodLabel,
  getDerivedAirChartReadings,
  resolveDerivedAirMetricEvidence,
  roundDerivedAirValueF,
} from '../src/derivedAirEvidence.ts'
import type { HostedGen2MeasurementRow } from '../src/types/hostedGen2Measurements.ts'

const NOW = Date.parse('2026-08-19T12:01:00Z')

const sourceRow = (
  measurementName: 'air_temperature' | 'relative_humidity',
  value: number | null,
  overrides: Partial<HostedGen2MeasurementRow> = {},
): HostedGen2MeasurementRow => ({
  batch_id: '10000000-0000-4000-8000-000000000001',
  device_id: 'device-1',
  device_key: 'balcony02',
  device_label: 'Balcony02',
  device_role: 'balcony_controller',
  measured_at: '2026-08-19T12:00:00Z',
  firmware_version: '1.0.0',
  build_profile: 'balcony02',
  record_index: measurementName === 'air_temperature' ? 1 : 2,
  sensor_key: 'bme280_air',
  sensor_type: 'BME280',
  physical_sensor_id: null,
  measurement_name: measurementName,
  measurement_value: value,
  measurement_unit: measurementName === 'air_temperature' ? 'F' : '%',
  valid: true,
  quality: 'good',
  reason: 'read_ok',
  batch_created_at: '2026-08-19T12:00:05Z',
  ...overrides,
})

const pair = (
  temperatureF: number,
  humidityPercent: number,
  overrides: Partial<HostedGen2MeasurementRow> = {},
): HostedGen2MeasurementRow[] => [
  sourceRow('air_temperature', temperatureF, overrides),
  sourceRow('relative_humidity', humidityPercent, overrides),
]

test('calculates ordinary NWS Heat Index and WMO Magnus dew point in the approved units', () => {
  const feelsLike = calculateFeelsLikeF(90, 70)
  assert.equal(feelsLike.status, 'available')
  if (feelsLike.status === 'available') {
    assert.equal(feelsLike.method, 'heat-index')
    assert.ok(Math.abs(feelsLike.valueF - 105.922) < 0.001)
    assert.equal(roundDerivedAirValueF(feelsLike.valueF), 105.9)
  }

  const dewPoint = calculateDewPointF(90, 70)
  assert.equal(dewPoint.status, 'available')
  if (dewPoint.status === 'available') {
    assert.equal(dewPoint.method, 'dew-point')
    assert.ok(Math.abs(dewPoint.valueF - 78.8924) < 0.001)
    assert.equal(roundDerivedAirValueF(dewPoint.valueF), 78.9)
  }
})

test('uses unrounded Heat Index applicability boundaries and the explicit air-temperature fallback', () => {
  const belowScreen = calculateFeelsLikeF(80, 48.9)
  assert.deepEqual(belowScreen, {
    status: 'available', valueF: 80, method: 'air-temperature-fallback',
  })

  const exactScreen = calculateFeelsLikeF(80, 48.93617021276596)
  assert.equal(exactScreen.status, 'available')
  if (exactScreen.status === 'available') {
    assert.equal(exactScreen.method, 'heat-index')
    assert.equal(roundDerivedAirValueF(exactScreen.valueF), 80.7)
  }

  assert.deepEqual(calculateFeelsLikeF(70, 80), {
    status: 'available', valueF: 70, method: 'air-temperature-fallback',
  })
  assert.equal(calculateFeelsLikeF(112, 50).status, 'available')
  assert.deepEqual(calculateFeelsLikeF(112.000001, 50), {
    status: 'unavailable', reason: 'temperature-above-heat-index-range',
  })
})

test('applies the NWS low- and high-humidity regression adjustments', () => {
  const lowHumidity = calculateFeelsLikeF(100, 10)
  const highHumidity = calculateFeelsLikeF(85, 90)
  assert.equal(lowHumidity.status, 'available')
  assert.equal(highHumidity.status, 'available')
  if (lowHumidity.status === 'available') {
    assert.equal(roundDerivedAirValueF(lowHumidity.valueF), 94.1)
  }
  if (highHumidity.status === 'available') {
    assert.equal(roundDerivedAirValueF(highHumidity.valueF), 101.8)
  }
})

test('handles dew-point saturation, near-zero humidity, zero humidity, and conversion boundaries', () => {
  const saturated = calculateDewPointF(68, 100)
  assert.equal(saturated.status, 'available')
  if (saturated.status === 'available') assert.equal(roundDerivedAirValueF(saturated.valueF), 68)

  const freezing = calculateDewPointF(32, 100)
  assert.equal(freezing.status, 'available')
  if (freezing.status === 'available') assert.equal(roundDerivedAirValueF(freezing.valueF), 32)

  assert.equal(calculateDewPointF(68, 0.5).status, 'available')
  assert.deepEqual(calculateDewPointF(68, 0.4), {
    status: 'unavailable', reason: 'dew-point-result-outside-range',
  })
  assert.deepEqual(calculateDewPointF(68, 0), {
    status: 'unavailable', reason: 'humidity-not-positive',
  })
  assert.deepEqual(calculateFeelsLikeF(80, 0), {
    status: 'unavailable', reason: 'humidity-not-positive',
  })
})

test('requires one exact eligible °F/% source pair with shared package provenance', () => {
  assert.equal(buildDerivedAirBatchEvaluations(pair(90, 70))[0]?.pair?.batchId,
    '10000000-0000-4000-8000-000000000001')

  const mismatchedBatch = [
    sourceRow('air_temperature', 90),
    sourceRow('relative_humidity', 70, { batch_id: '20000000-0000-4000-8000-000000000002' }),
  ]
  assert.equal(buildDerivedAirBatchEvaluations(mismatchedBatch)[0]?.failureReason, 'batch-mismatch')

  const mismatchedDeviceAndBatch = [
    sourceRow('air_temperature', 90),
    sourceRow('relative_humidity', 70, {
      batch_id: '20000000-0000-4000-8000-000000000002',
      device_id: 'device-2',
    }),
  ]
  assert.equal(buildDerivedAirBatchEvaluations(mismatchedDeviceAndBatch)[0]?.failureReason,
    'device-mismatch')

  assert.equal(buildDerivedAirBatchEvaluations([
    sourceRow('air_temperature', 90),
    sourceRow('relative_humidity', 70, { device_id: 'device-2' }),
  ])[0]?.failureReason, 'device-mismatch')

  assert.equal(buildDerivedAirBatchEvaluations([
    sourceRow('air_temperature', 90),
    sourceRow('relative_humidity', 70, { measured_at: '2026-08-19T11:59:59Z' }),
  ])[0]?.failureReason, 'source-time-mismatch')
  assert.equal(buildDerivedAirBatchEvaluations(pair(90, 70, {
    measured_at: 'not-a-time',
  }))[0]?.failureReason, 'source-time-mismatch')

  assert.equal(buildDerivedAirBatchEvaluations([
    sourceRow('air_temperature', 90),
    sourceRow('relative_humidity', 70, { batch_created_at: '2026-08-19T12:00:06Z' }),
  ])[0]?.failureReason, 'batch-provenance-mismatch')
  assert.equal(buildDerivedAirBatchEvaluations(pair(90, 70, {
    batch_created_at: 'not-a-time',
  }))[0]?.failureReason, 'batch-provenance-mismatch')

  assert.equal(buildDerivedAirBatchEvaluations(pair(90, 70, { measurement_unit: 'C' }))[0]?.failureReason,
    'unit-mismatch')
  const hostedViewPair = buildDerivedAirBatchEvaluations(pair(90, 70, { batch_id: null }))[0]
  assert.equal(hostedViewPair?.failureReason, null)
  assert.equal(hostedViewPair?.pair?.batchId, null)
  assert.equal(hostedViewPair?.pair?.batchCreatedAt, '2026-08-19T12:00:05Z')

  assert.equal(buildDerivedAirBatchEvaluations(pair(90, 70, {
    batch_id: null,
    batch_created_at: null,
  }))[0]?.failureReason, 'batch-identity-missing')
})

test('exact hosted provenance keeps ordinary derived cards available without batch_id', () => {
  const latest = pair(95.7, 38, { batch_id: null })
  const feelsLike = resolveDerivedAirMetricEvidence({
    rows: latest,
    metric: 'feels-like',
    deviceReportingActive: true,
    nowMs: NOW,
  })
  const dewPoint = resolveDerivedAirMetricEvidence({
    rows: latest,
    metric: 'dew-point',
    deviceReportingActive: true,
    nowMs: NOW,
  })

  assert.equal(feelsLike.state, 'current')
  assert.equal(feelsLike.reading?.method, 'heat-index')
  assert.equal(dewPoint.state, 'current')
  assert.equal(dewPoint.reading?.method, 'dew-point')
  assert.equal(getDerivedAirChartReadings(latest, 'feels-like').length, 1)
  assert.equal(getDerivedAirChartReadings(latest, 'dew-point').length, 1)
})

test('does not independently recover current/stale, invalid, implausible, or ambiguous inputs', () => {
  const earlier = pair(88, 60, {
    batch_id: '10000000-0000-4000-8000-000000000001',
    measured_at: '2026-08-19T11:45:00Z',
    batch_created_at: '2026-08-19T11:45:05Z',
  })
  const latestTemperatureOnly = sourceRow('air_temperature', 90, {
    batch_id: '20000000-0000-4000-8000-000000000002',
  })
  const evidence = resolveDerivedAirMetricEvidence({
    rows: [latestTemperatureOnly, ...earlier], metric: 'feels-like',
    deviceReportingActive: true, nowMs: NOW,
  })
  assert.equal(evidence.state, 'last-good')
  assert.equal(evidence.reading?.pair.batchId, earlier[0]?.batch_id)

  const invalidLatest = pair(90, 70, {
    batch_id: '30000000-0000-4000-8000-000000000003',
    valid: false, quality: 'failed', measurement_value: null,
  })
  assert.equal(resolveDerivedAirMetricEvidence({
    rows: [...invalidLatest, ...earlier], metric: 'dew-point',
    deviceReportingActive: true, nowMs: NOW,
  }).state, 'last-good')

  const implausibleLatest = pair(90, 101, {
    batch_id: '40000000-0000-4000-8000-000000000004',
  })
  assert.equal(resolveDerivedAirMetricEvidence({
    rows: [...implausibleLatest, ...earlier], metric: 'dew-point',
    deviceReportingActive: true, nowMs: NOW,
  }).state, 'last-reliable')

  const ambiguousLatest = [
    ...pair(90, 70, { batch_id: '50000000-0000-4000-8000-000000000005' }),
    sourceRow('relative_humidity', 71, {
      batch_id: '50000000-0000-4000-8000-000000000005', record_index: 3,
    }),
  ]
  assert.equal(buildDerivedAirBatchEvaluations(ambiguousLatest)[0]?.failureReason, 'ambiguous-source')
})

test('preserves formula-domain wording without hiding current trustworthy evidence behind older values', () => {
  const older = pair(90, 70, {
    batch_id: '10000000-0000-4000-8000-000000000001',
    measured_at: '2026-08-19T11:45:00Z',
    batch_created_at: '2026-08-19T11:45:05Z',
  })
  const aboveRange = pair(112.1, 50, {
    batch_id: '20000000-0000-4000-8000-000000000002',
  })
  const feelsLike = resolveDerivedAirMetricEvidence({
    rows: [...aboveRange, ...older], metric: 'feels-like',
    deviceReportingActive: true, nowMs: NOW,
  })
  assert.equal(feelsLike.state, 'above-supported-range')
  assert.equal(feelsLike.reading, null)
  assert.match(feelsLike.detail ?? '', /112/)

  const outsideDewRange = pair(0, 1, {
    batch_id: '30000000-0000-4000-8000-000000000003',
  })
  const dewPoint = resolveDerivedAirMetricEvidence({
    rows: [...outsideDewRange, ...older], metric: 'dew-point',
    deviceReportingActive: true, nowMs: NOW,
  })
  assert.equal(dewPoint.state, 'unavailable')
  assert.equal(dewPoint.reading, null)
})

test('preserves Phase 8C.3 repeated invalid and omission escalation for paired evidence', () => {
  const good = pair(88, 60, {
    batch_id: '10000000-0000-4000-8000-000000000001',
    measured_at: '2026-08-19T11:45:00Z',
    batch_created_at: '2026-08-19T11:45:05Z',
  })
  const invalid = (batchId: string, measuredAt: string) => pair(90, 70, {
    batch_id: batchId,
    measured_at: measuredAt,
    batch_created_at: measuredAt,
    valid: false,
    quality: 'failed',
    measurement_value: null,
  })
  const repeatedInvalid = resolveDerivedAirMetricEvidence({
    rows: [
      ...invalid('30000000-0000-4000-8000-000000000003', '2026-08-19T12:00:00Z'),
      ...invalid('20000000-0000-4000-8000-000000000002', '2026-08-19T11:55:00Z'),
      ...good,
    ],
    metric: 'dew-point', deviceReportingActive: true, nowMs: NOW,
  })
  assert.equal(repeatedInvalid.state, 'last-good')
  assert.deepEqual(repeatedInvalid.failureCount, { count: 2, isLowerBound: false })
  assert.equal(repeatedInvalid.severity, 'caution')

  const omitted = (batchId: string, measuredAt: string) => sourceRow('air_temperature', 90, {
    batch_id: batchId,
    measured_at: measuredAt,
    batch_created_at: measuredAt,
  })
  const repeatedOmission = resolveDerivedAirMetricEvidence({
    rows: [
      omitted('40000000-0000-4000-8000-000000000004', '2026-08-19T12:00:00Z'),
      omitted('30000000-0000-4000-8000-000000000003', '2026-08-19T11:55:00Z'),
      omitted('20000000-0000-4000-8000-000000000002', '2026-08-19T11:50:00Z'),
      ...good,
    ],
    metric: 'feels-like', deviceReportingActive: true, nowMs: NOW,
  })
  assert.equal(repeatedOmission.state, 'last-good')
  assert.deepEqual(repeatedOmission.failureCount, { count: 3, isLowerBound: false })
  assert.equal(repeatedOmission.severity, 'caution')
})

test('uses paired evidence age and respects selected-window changes', () => {
  const stalePair = pair(90, 70, {
    measured_at: '2026-08-19T11:00:00Z',
    batch_created_at: '2026-08-19T11:00:05Z',
  })
  const stale = resolveDerivedAirMetricEvidence({
    rows: stalePair, metric: 'feels-like', deviceReportingActive: false, nowMs: NOW,
  })
  assert.equal(stale.state, 'not-current')
  assert.equal(stale.evidenceAgeMs, 61 * 60 * 1000)

  const selectedWindowMissingHumidity = [stalePair[0]!]
  const excluded = resolveDerivedAirMetricEvidence({
    rows: selectedWindowMissingHumidity, metric: 'feels-like',
    deviceReportingActive: false, nowMs: NOW,
  })
  assert.equal(excluded.state, 'unavailable')
  assert.equal(excluded.reading, null)
})

test('chart points use whole latest batches and exclude unrelated or unusable rows', () => {
  const validAtNoon = pair(80, 48.9)
  const validEarlier = pair(90, 70, {
    batch_id: '20000000-0000-4000-8000-000000000002',
    measured_at: '2026-08-19T11:45:00Z',
    batch_created_at: '2026-08-19T11:45:05Z',
  })
  const incompleteLaterDuplicate = sourceRow('air_temperature', 81, {
    batch_id: '30000000-0000-4000-8000-000000000003',
    batch_created_at: '2026-08-19T12:00:06Z',
  })
  const mismatched = [
    sourceRow('air_temperature', 85, {
      batch_id: '40000000-0000-4000-8000-000000000004',
      measured_at: '2026-08-19T11:30:00Z',
    }),
    sourceRow('relative_humidity', 80, {
      batch_id: '50000000-0000-4000-8000-000000000005',
      measured_at: '2026-08-19T11:30:00Z',
    }),
  ]

  const readings = getDerivedAirChartReadings([
    ...validAtNoon, ...validEarlier, incompleteLaterDuplicate, ...mismatched,
  ], 'feels-like')
  assert.equal(readings.length, 1)
  assert.equal(readings[0]?.pair.batchId, validEarlier[0]?.batch_id)
  assert.equal(readings[0]?.method, 'heat-index')

  const fallbackOnly = getDerivedAirChartReadings(validAtNoon, 'feels-like')
  assert.equal(fallbackOnly[0]?.method, 'air-temperature-fallback')
  assert.equal(fallbackOnly[0]?.valueF, 80)
})

test('rounding is display-only and deterministic at one decimal place', () => {
  assert.equal(roundDerivedAirValueF(80.04), 80)
  assert.equal(roundDerivedAirValueF(80.05), 80.1)
  assert.equal(roundDerivedAirValueF(80.149), 80.1)
  assert.equal(roundDerivedAirValueF(80.15), 80.2)
})

test('chart method labels distinguish Heat Index, air-temperature fallback, and Dew Point', () => {
  assert.equal(getDerivedAirChartMethodLabel('derived_heat_index'), 'Heat Index')
  assert.equal(getDerivedAirChartMethodLabel('derived_air_temperature_fallback'),
    'Air temperature fallback')
  assert.equal(getDerivedAirChartMethodLabel('derived_dew_point'), 'Dew Point calculation')
  assert.equal(getDerivedAirChartMethodLabel('read_ok'), null)
})
