import assert from 'node:assert/strict'
import test from 'node:test'
import {
  doesCapabilityChartRowMatchSeries,
  getCapabilityCardDescriptors,
  getCapabilityChartSeriesDescriptors,
} from '../src/capabilityPresentation.ts'
import {
  describeLastGoodEvidenceSource,
  resolveCommissionedCardEvidence,
} from '../src/commissionedCardEvidence.ts'
import { getHostedGen2SensorPresentationState } from '../src/hostedGen2Presentation.ts'
import type { CommissionedDeviceCapability } from '../src/types/deviceCapabilities.ts'
import type { HostedGen2MeasurementRow } from '../src/types/hostedGen2Measurements.ts'

const PHYSICAL_IDENTITIES: Readonly<Record<string, string>> = {
  sen0308_m01: 'M1', sen0308_m02: 'M4', sen0308_m03: 'M3',
  sen0562_l01: 'L02', sen0562_l02: 'L03', sen0562_l03: 'L01',
}

const TELEMETRY_PHYSICAL_IDENTITIES: Readonly<Record<string, string>> = {
  sen0308_m01: 'SEN0308-M01', sen0308_m02: 'SEN0308-M02', sen0308_m03: 'SEN0308-M03',
  sen0562_l01: 'SEN0562-L01', sen0562_l02: 'SEN0562-L02', sen0562_l03: 'SEN0562-L03',
}

const capability = (logicalSensorKey: string): CommissionedDeviceCapability => ({
  deviceId: 'device-1', logicalSensorKey,
  sensorFamily: logicalSensorKey.startsWith('sen0308') ? 'sen0308' : 'sen0562',
  logicalChannel: logicalSensorKey.slice(-3).toUpperCase(),
  expectedMeasurementNames: [logicalSensorKey.startsWith('sen0308') ? 'raw_adc' : 'ambient_light'],
  friendlyName: null, locationLabel: null,
  physicalSensorId: PHYSICAL_IDENTITIES[logicalSensorKey] ?? null,
  effectiveFrom: '2026-08-12T17:03:41Z', effectiveTo: null,
})

const measurement = (overrides: Partial<HostedGen2MeasurementRow> = {}): HostedGen2MeasurementRow => ({
  batch_id: '10000000-0000-4000-8000-000000000001',
  device_id: 'device-1', device_key: 'balcony02', device_label: 'Balcony02',
  device_role: 'support_bench', measured_at: '2026-08-16T12:00:00Z',
  firmware_version: null, build_profile: null, record_index: 0,
  sensor_key: 'sen0308_m01', sensor_type: 'sen0308', physical_sensor_id: 'SEN0308-M01',
  measurement_name: 'raw_adc', measurement_value: 12000, measurement_unit: 'count',
  valid: true, quality: 'good', reason: null, batch_created_at: null,
  ...overrides,
})

test('production physical identities attach all moisture and light card and chart evidence', () => {
  const capabilities = Object.keys(PHYSICAL_IDENTITIES).map(capability)
  const cards = getCapabilityCardDescriptors(capabilities)
  const series = getCapabilityChartSeriesDescriptors(cards)

  for (const [logicalSensorKey, provisioningPhysicalId] of Object.entries(PHYSICAL_IDENTITIES)) {
    const card = cards.find((candidate) => candidate.sensorKey === logicalSensorKey)
    assert.equal(card?.physicalSensorId, provisioningPhysicalId)
    const row = measurement({
      sensor_key: logicalSensorKey,
      sensor_type: logicalSensorKey.startsWith('sen0308') ? 'sen0308' : 'sen0562',
      physical_sensor_id: TELEMETRY_PHYSICAL_IDENTITIES[logicalSensorKey],
      measurement_name: logicalSensorKey.startsWith('sen0308') ? 'raw_adc' : 'ambient_light',
      measurement_unit: logicalSensorKey.startsWith('sen0308') ? 'count' : 'lux',
    })
    const chartSeries = series.find((candidate) => candidate.cardKey === card?.key)
    assert.equal(chartSeries ? doesCapabilityChartRowMatchSeries(row, chartSeries) : false, true)
  }
})

test('adds derived temperature series only when both BME280 source measurements are commissioned', () => {
  const bmeCapability: CommissionedDeviceCapability = {
    deviceId: 'device-1', logicalSensorKey: 'bme280_air', sensorFamily: 'bme280',
    logicalChannel: 'air',
    expectedMeasurementNames: ['air_temperature', 'relative_humidity', 'barometric_pressure'],
    friendlyName: 'Balcony Air Conditions', locationLabel: 'Near controller',
    physicalSensorId: null, effectiveFrom: '2026-08-12T17:03:41Z', effectiveTo: null,
  }
  const fullSeries = getCapabilityChartSeriesDescriptors(
    getCapabilityCardDescriptors([bmeCapability]),
  )
  assert.equal(fullSeries.some((series) => series.cardKey === 'feels-like'), true)
  assert.equal(fullSeries.some((series) => series.cardKey === 'dew-point'), true)

  const temperatureOnlyCards = getCapabilityCardDescriptors([{
    ...bmeCapability,
    expectedMeasurementNames: ['air_temperature'],
  }])
  const temperatureOnlySeries = getCapabilityChartSeriesDescriptors(temperatureOnlyCards)
  assert.equal(temperatureOnlySeries.some((series) => series.cardKey === 'feels-like'), false)
  assert.equal(temperatureOnlySeries.some((series) => series.cardKey === 'dew-point'), false)
})

test('M02 uses physical M4 and L01 uses physical L02 without cross-channel attachment', () => {
  const cards = getCapabilityCardDescriptors([
    capability('sen0308_m01'), capability('sen0308_m02'),
    capability('sen0562_l01'), capability('sen0562_l02'),
  ])
  const m02 = cards.find((card) => card.sensorKey === 'sen0308_m02')!
  const l01 = cards.find((card) => card.sensorKey === 'sen0562_l01')!
  assert.equal(m02.physicalSensorId, 'M4')
  assert.equal(l01.physicalSensorId, 'L02')
  assert.equal(resolveCommissionedCardEvidence(m02, [measurement({
    sensor_key: 'sen0308_m02', physical_sensor_id: 'SEN0308-M02',
  })]).latestMatchingRow?.physical_sensor_id, 'SEN0308-M02')
  assert.equal(resolveCommissionedCardEvidence(l01, [measurement({
    sensor_key: 'sen0562_l01', sensor_type: 'sen0562', physical_sensor_id: 'SEN0562-L01',
    measurement_name: 'ambient_light', measurement_unit: 'lux',
  })]).latestMatchingRow?.physical_sensor_id, 'SEN0562-L01')
  assert.equal(resolveCommissionedCardEvidence(m02, [measurement()]).latestMatchingRow, null)
  assert.equal(resolveCommissionedCardEvidence(m02, [measurement({
    sensor_key: 'sen0308_m01', physical_sensor_id: 'SEN0308-M02',
  })]).latestMatchingRow, null)
  assert.equal(resolveCommissionedCardEvidence(l01, [measurement({
    sensor_key: 'sen0562_l02', sensor_type: 'sen0562', physical_sensor_id: 'SEN0562-L01',
    measurement_name: 'ambient_light', measurement_unit: 'lux',
  })]).latestMatchingRow, null)
  assert.equal(resolveCommissionedCardEvidence(m02, [measurement({
    sensor_key: 'sen0308_m02', physical_sensor_id: 'SEN0308-M02',
    measurement_name: 'ambient_light', measurement_unit: 'lux',
  })]).latestMatchingRow, null)
})

test('DS18B20 legacy temperature aliases only for the exact commissioned logical key', () => {
  const dsCapability: CommissionedDeviceCapability = {
    ...capability('ds18b20_temperature'), sensorFamily: 'ds18b20',
    logicalChannel: 'temperature', expectedMeasurementNames: ['soil temp'],
    physicalSensorId: 'T1',
  }
  const dsCard = getCapabilityCardDescriptors([dsCapability])[0]!
  const legacyRow = measurement({
    sensor_key: 'ds18b20_temperature', sensor_type: 'ds18b20',
    physical_sensor_id: 'DS18B20-T1', measurement_name: 'temperature',
    measurement_unit: 'F', measurement_value: 70,
  })
  assert.equal(resolveCommissionedCardEvidence(dsCard, [legacyRow]).latestMatchingRow, legacyRow)

  const otherCapability: CommissionedDeviceCapability = {
    ...dsCapability, logicalSensorKey: 'other_temperature', physicalSensorId: 'OTHER-T1',
  }
  const otherCard = getCapabilityCardDescriptors([otherCapability])[0]!
  assert.equal(resolveCommissionedCardEvidence(otherCard, [{
    ...legacyRow, sensor_key: 'other_temperature', physical_sensor_id: 'OTHER-TELEMETRY',
  }]).latestMatchingRow, null)
})

test('absent latest batch retains older good evidence with honest source timestamps', () => {
  const card = getCapabilityCardDescriptors([capability('sen0308_m01')])[0]!
  const oldGood = measurement({ measured_at: '2026-08-15T10:00:00Z' })
  const otherLatest = measurement({
    measured_at: '2026-08-16T12:00:00Z', sensor_key: 'sen0308_m02',
    physical_sensor_id: 'SEN0308-M02', measurement_value: 12500,
  })
  const evidence = resolveCommissionedCardEvidence(card, [otherLatest, oldGood], Date.parse('2026-08-16T12:01:00Z'))
  assert.equal(evidence.appearsInLatestPackage, false)
  assert.equal(evidence.lastGoodRow, oldGood)
  const description = describeLastGoodEvidenceSource(
    oldGood.measured_at, evidence.latestMatchingRow?.measured_at ?? null,
    evidence.latestPackageMeasuredAt,
  )
  assert.match(description, /Last good evidence: 2026-08-15/)
  assert.match(description, /Latest device package: 2026-08-16/)
})

test('current invalid and stale invalid evidence both recover older good evidence without a cutoff', () => {
  const card = getCapabilityCardDescriptors([capability('sen0308_m01')])[0]!
  const oldGood = measurement({ measured_at: '2026-07-01T00:00:00Z' })
  for (const invalidAt of ['2026-08-16T11:59:00Z', '2026-08-15T00:00:00Z']) {
    const invalid = measurement({ measured_at: invalidAt, measurement_value: null, valid: false, quality: 'failed' })
    const evidence = resolveCommissionedCardEvidence(card, [invalid, oldGood], Date.parse('2026-08-16T12:00:00Z'))
    assert.equal(evidence.latestMatchingRow, invalid)
    assert.equal(evidence.lastGoodRow, oldGood)
  }
})

test('stale valid, never reported, derived RMI fallback, and commissioned not-installed boundary remain distinct', () => {
  const card = getCapabilityCardDescriptors([capability('sen0308_m01')])[0]!
  const staleGood = measurement({ measured_at: '2026-08-15T00:00:00Z', measurement_value: 11900 })
  const stale = resolveCommissionedCardEvidence(card, [staleGood], Date.parse('2026-08-16T12:00:00Z'))
  assert.equal(stale.latestMatchingIsCurrent, false)
  assert.equal(stale.lastGoodRow?.measurement_value, 11900)
  assert.equal(resolveCommissionedCardEvidence(card, []).latestMatchingRow, null)

  const invalid = measurement({ measured_at: '2026-08-16T12:00:00Z', measurement_value: null, valid: false, quality: 'failed' })
  const derivedFallback = resolveCommissionedCardEvidence(card, [invalid, staleGood])
  assert.equal(derivedFallback.lastGoodRow?.measurement_value, 11900)
  assert.notEqual(getHostedGen2SensorPresentationState(invalid, {
    hasHistory: true, latestPackageMeasuredAt: invalid.measured_at,
    latestPackageIsCurrent: true, profileInstalled: false, commissioned: true,
  }), 'Not Installed')
})
