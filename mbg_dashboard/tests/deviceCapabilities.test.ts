import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDeviceCapabilitySessionCache,
  getCapabilityConfigurationState,
  getCurrentDeviceCapabilities,
  normalizeSupportDeviceCapability,
} from '../src/deviceCapabilities.ts'
import { getCapabilityCardDescriptors, getCapabilityChartSeriesDescriptors } from '../src/capabilityPresentation.ts'
import { getHostedGen2CanonicalMeasurementIdentity } from '../src/hostedGen2Presentation.ts'
import type { SupportDeviceCapabilityRow } from '../src/types/deviceCapabilities.ts'

const row = (overrides: Partial<SupportDeviceCapabilityRow> = {}): SupportDeviceCapabilityRow => ({
  device_id: 'device-1',
  logical_sensor_key: 'bme280_air',
  sensor_family: 'BME280',
  logical_channel: 'air',
  expected_measurement_names: ['air_temperature', 'relative_humidity', 'barometric_pressure'],
  friendly_name: '  Bench air  ',
  location_label: '  Upper shelf  ',
  physical_sensor_id: null,
  effective_from: '2026-08-12T17:03:41Z',
  effective_to: null,
  ...overrides,
})

test('normalizes one logical sensor with multiple expected measurements', () => {
  const normalized = normalizeSupportDeviceCapability(row())
  assert.equal(normalized.sensorFamily, 'bme280')
  assert.equal(normalized.friendlyName, 'Bench air')
  assert.deepEqual(normalized.expectedMeasurementNames, [
    'air_temperature', 'relative_humidity', 'barometric_pressure',
  ])
})

test('filters inclusive effective_from and exclusive effective_to', () => {
  const now = new Date('2026-08-16T12:00:00Z')
  const current = getCurrentDeviceCapabilities([
    row(),
    row({ logical_sensor_key: 'future', effective_from: '2026-08-17T00:00:00Z' }),
    row({ logical_sensor_key: 'retired', effective_to: now.toISOString() }),
  ], now)
  assert.deepEqual(current.map((capability) => capability.logicalSensorKey), ['bme280_air'])
})

test('maps only exact commissioned Balcony02 identities in deterministic order', () => {
  const capabilities = getCurrentDeviceCapabilities([
    row({ logical_sensor_key: 'sen0308_m03', sensor_family: 'sen0308', logical_channel: 'M03', expected_measurement_names: ['raw_adc'] }),
    row({ logical_sensor_key: 'sen0562_l02', sensor_family: 'sen0562', logical_channel: 'L02', expected_measurement_names: ['ambient_light'] }),
    row(),
    row({ logical_sensor_key: 'ds18b20_temperature', sensor_family: 'ds18b20', logical_channel: 'temperature', expected_measurement_names: ['soil temp'] }),
    row({ logical_sensor_key: 'sen0204_wl01', sensor_family: 'sen0204', logical_channel: 'WL01', expected_measurement_names: ['reservoir_liquid_detected'] }),
  ], new Date('2026-08-16T12:00:00Z'))
  assert.deepEqual(getCapabilityCardDescriptors(capabilities).map((card) => card.key), [
    'light-l02', 'air-temperature', 'humidity', 'atmospheric-pressure',
    'reservoir-water', 'moisture-m03', 'soil-temperature',
  ])
})

test('maps the complete nine-sensor Balcony02 declaration to eleven cards', () => {
  const declared = [
    row(),
    row({ logical_sensor_key: 'ds18b20_temperature', sensor_family: 'ds18b20', logical_channel: 'temperature', expected_measurement_names: ['soil temp'] }),
    ...['m01', 'm02', 'm03'].map((channel) => row({ logical_sensor_key: `sen0308_${channel}`, sensor_family: 'sen0308', logical_channel: channel, expected_measurement_names: ['raw_adc'] })),
    ...['l01', 'l02', 'l03'].map((channel) => row({ logical_sensor_key: `sen0562_${channel}`, sensor_family: 'sen0562', logical_channel: channel, expected_measurement_names: ['ambient_light'] })),
    row({ logical_sensor_key: 'sen0204_wl01', sensor_family: 'sen0204', logical_channel: 'wl01', expected_measurement_names: ['reservoir_liquid_detected'] }),
  ]
  const cards = getCapabilityCardDescriptors(
    getCurrentDeviceCapabilities(declared, new Date('2026-08-16T12:00:00Z')),
  )
  assert.equal(cards.length, 11)
  assert.deepEqual(cards.map((card) => card.key), [
    'light-l01', 'light-l02', 'light-l03',
    'air-temperature', 'humidity', 'atmospheric-pressure',
    'reservoir-water', 'moisture-m01', 'moisture-m02', 'moisture-m03',
    'soil-temperature',
  ])
})

test('legacy temperature aliases only the exact DS18B20 logical key', () => {
  const measurement = {
    batch_id: '10000000-0000-4000-8000-000000000001',
    device_id: 'device-1', device_key: null, device_label: null, device_role: null,
    measured_at: '2026-08-16T12:00:00Z', firmware_version: null, build_profile: null,
    record_index: 0, sensor_key: 'ds18b20_temperature', sensor_type: 'DS18B20',
    physical_sensor_id: null, measurement_name: 'temperature', measurement_value: 72,
    measurement_unit: 'F', valid: true, quality: 'good', reason: null, batch_created_at: null,
  }
  assert.equal(getHostedGen2CanonicalMeasurementIdentity(measurement), 'soil temp')
  assert.equal(getHostedGen2CanonicalMeasurementIdentity({
    ...measurement, sensor_key: 'other_temperature', sensor_type: 'DS18B20-compatible',
  }), 'temperature')
})

test('M04, L04, and LUX04 never map to ordinary cards and blank names use a fallback', () => {
  const capabilities = getCurrentDeviceCapabilities([
    row({ logical_sensor_key: 'sen0308_m04', sensor_family: 'sen0308', logical_channel: 'M04', expected_measurement_names: ['raw_adc'], friendly_name: null, location_label: null }),
    row({ logical_sensor_key: 'sen0562_l04', sensor_family: 'sen0562', logical_channel: 'L04', expected_measurement_names: ['ambient_light'] }),
    row({ logical_sensor_key: 'lux04', sensor_family: 'lux', logical_channel: 'L04', expected_measurement_names: ['ambient_light'] }),
  ], new Date('2026-08-16T12:00:00Z'))
  const cards = getCapabilityCardDescriptors(capabilities)
  assert.equal(cards.every((card) => card.isUnsupported), true)
  assert.equal(cards.find((card) => card.sensorKey === 'sen0308_m04')?.label, 'Sen0308 M04')
})

test('session cache fetches once per device and retries failures', async () => {
  const calls: string[] = []
  const cachedLoad = createDeviceCapabilitySessionCache(async (deviceId) => {
    calls.push(deviceId)
    return [row({ device_id: deviceId })]
  })
  await Promise.all([cachedLoad('device-1'), cachedLoad('device-1')])
  await cachedLoad('device-2')
  await cachedLoad('device-1')
  assert.deepEqual(calls, ['device-1', 'device-2'])
})

test('configuration loading, failure, zero, and ready states never imply fallback cards', () => {
  assert.equal(getCapabilityConfigurationState(true, null, 0).kind, 'loading')
  assert.deepEqual(getCapabilityConfigurationState(false, 'technical', 0), {
    kind: 'failure', message: 'Unable to load device configuration.',
  })
  assert.deepEqual(getCapabilityConfigurationState(false, null, 0), {
    kind: 'empty', message: 'No commissioned sensors are configured for this device.',
  })
  assert.equal(getCapabilityConfigurationState(false, null, 1).kind, 'ready')
})

test('commissioned chart series remain eligible without measurement rows', () => {
  const cards = getCapabilityCardDescriptors(getCurrentDeviceCapabilities([row()], new Date('2026-08-16T12:00:00Z')))
  assert.deepEqual(getCapabilityChartSeriesDescriptors(cards).map((series) => series.cardKey), [
    'air-temperature', 'feels-like', 'dew-point', 'humidity', 'atmospheric-pressure',
  ])
})
