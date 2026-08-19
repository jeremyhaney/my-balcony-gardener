import assert from 'node:assert/strict'
import test from 'node:test'
import {
  HOSTED_GEN2_MEASUREMENT_COLUMNS,
  markHostedGen2BatchIdentityUnavailable,
} from '../src/hostedGen2MeasurementQueryContract.ts'
import type { HostedGen2MeasurementRow } from '../src/types/hostedGen2Measurements.ts'

test('the measurement query uses the existing hosted contract without batch_id', () => {
  assert.doesNotMatch(HOSTED_GEN2_MEASUREMENT_COLUMNS, /(?:^|, )batch_id(?:,|$)/)
  assert.match(HOSTED_GEN2_MEASUREMENT_COLUMNS, /(?:^|, )batch_created_at(?:,|$)/)
})

test('hosted rows explicitly mark the optional batch UUID unavailable', () => {
  const row = {
    device_id: 'device-1',
    device_key: 'balcony',
    device_label: 'Balcony',
    device_role: 'primary',
    measured_at: '2026-08-19T12:00:00.000Z',
    firmware_version: '1.0.0',
    build_profile: 'production',
    record_index: 0,
    sensor_key: 'bme280_air',
    sensor_type: 'BME280',
    physical_sensor_id: 'air-1',
    measurement_name: 'air_temperature',
    measurement_value: 84,
    measurement_unit: 'F',
    valid: true,
    quality: 'good',
    reason: null,
    batch_created_at: '2026-08-19T12:00:01.000Z',
  } satisfies Omit<HostedGen2MeasurementRow, 'batch_id'>

  const mapped = markHostedGen2BatchIdentityUnavailable([row])

  assert.equal(mapped[0]?.batch_id, null)
  assert.equal(mapped[0]?.measurement_value, 84)
  assert.notEqual(mapped[0], row)
})
