import assert from 'node:assert/strict'
import test from 'node:test'
import { getHostedGen2MeasurementDisplay } from '../src/hostedGen2Display.ts'
import {
  formatGardenerMoistureIndexCardValue,
  getRelativeMoisturePresentation,
} from '../src/hostedGen2EnvironmentalPresentation.ts'
import {
  GARDENER_MOISTURE_FORMULA_TEXT,
  RMI_ADEQUATELY_WATERED_INDEX,
  RMI_ADEQUATELY_WATERED_RAW_ADC,
  RMI_INDEX_SPAN,
  RMI_OVERDUE_INDEX,
  RMI_OVERDUE_RAW_ADC,
  RMI_RAW_ADC_SPAN,
  calculateGardenerMoistureIndex,
  deriveGardenerMoistureIndexRow,
  getHostedGen2SensorPresentationState,
} from '../src/hostedGen2Presentation.ts'
import type { HostedGen2MeasurementRow } from '../src/types/hostedGen2Measurements.ts'

const row = (overrides: Partial<HostedGen2MeasurementRow> = {}): HostedGen2MeasurementRow => ({
  batch_id: '10000000-0000-4000-8000-000000000001',
  device_id: 'device-1', device_key: 'balcony02', device_label: 'Balcony02',
  device_role: 'support_bench', measured_at: '2026-08-24T12:00:00Z',
  firmware_version: null, build_profile: null, record_index: 0,
  sensor_key: 'sen0308_m01', sensor_type: 'sen0308', physical_sensor_id: 'SEN0308-M01',
  measurement_name: 'raw_adc', measurement_value: 11230, measurement_unit: 'count',
  valid: true, quality: 'good', reason: null, batch_created_at: '2026-08-24T12:00:05Z',
  ...overrides,
})

test('uses the direct provisional raw-ADC reference-point equation', () => {
  assert.equal(RMI_OVERDUE_RAW_ADC, 11230)
  assert.equal(RMI_OVERDUE_INDEX, 35)
  assert.equal(RMI_ADEQUATELY_WATERED_RAW_ADC, 7640)
  assert.equal(RMI_ADEQUATELY_WATERED_INDEX, 100)
  assert.equal(RMI_RAW_ADC_SPAN, 3590)
  assert.equal(RMI_INDEX_SPAN, 65)
  assert.equal(GARDENER_MOISTURE_FORMULA_TEXT, '35 + 65 * (11230 - raw_adc) / 3590')

  const cases: ReadonlyArray<[number, number]> = [
    [14820, -30], [13163, 0], [11230, 35], [10125, 55], [10000, 57],
    [9000, 75], [8469, 85], [8000, 93], [7640, 100], [7000, 112],
    [5431, 140], [5000, 148],
  ]

  for (const [rawAdc, expectedRmi] of cases) {
    assert.ok(
      Math.abs(calculateGardenerMoistureIndex(rawAdc) - expectedRmi) < 0.5,
      `raw ADC ${rawAdc}`,
    )
    assert.equal(Math.round(calculateGardenerMoistureIndex(rawAdc)), expectedRmi)
  }
})

test('keeps current-card and historical-row derivation on the same unclamped calculation', () => {
  const dryCurrent = deriveGardenerMoistureIndexRow(row({ measurement_value: 14820 }))
  const wetHistory = deriveGardenerMoistureIndexRow(row({
    measured_at: '2026-08-24T11:45:00Z', measurement_value: 5000,
  }))

  assert.equal(dryCurrent.measurement_value, calculateGardenerMoistureIndex(14820))
  assert.equal(wetHistory.measurement_value, calculateGardenerMoistureIndex(5000))
  assert.ok((dryCurrent.measurement_value ?? 0) < 0)
  assert.ok((wetHistory.measurement_value ?? 0) > 100)
  assert.equal(formatGardenerMoistureIndexCardValue(dryCurrent.measurement_value ?? 0), '-30 index')
  assert.equal(formatGardenerMoistureIndexCardValue(wetHistory.measurement_value ?? 0), '148 index')
  assert.equal(dryCurrent.measurement_name, 'moisture_index')
  assert.equal(dryCurrent.measurement_unit, 'index')
  assert.equal(wetHistory.measured_at, '2026-08-24T11:45:00Z')
})

test('classifies the unrounded RMI before whole-number card display rounding', () => {
  const calculated = calculateGardenerMoistureIndex(10125)

  assert.ok(calculated > 55 && calculated < 55.01)
  assert.equal(Math.round(calculated), 55)
  assert.equal(getRelativeMoisturePresentation(calculated)?.label, 'Moist')
  assert.equal(getRelativeMoisturePresentation(55)?.label, 'Dry')
})

test('does not let whole-number display rounding cross the upper wet-band boundaries', () => {
  assert.equal(formatGardenerMoistureIndexCardValue(99.99), '100 index')
  assert.equal(getRelativeMoisturePresentation(99.99)?.label, 'Moist')
  assert.equal(getRelativeMoisturePresentation(100)?.label, 'Well-watered')

  assert.equal(formatGardenerMoistureIndexCardValue(234.99), '235 index')
  assert.equal(getRelativeMoisturePresentation(234.99)?.label, 'Very Wet')
  assert.equal(getRelativeMoisturePresentation(235)?.label, 'Saturated')
})

test('does not turn an eligible negative RMI into a sensor fault or clamp it', () => {
  const rawRow = row({ measurement_value: 14820 })
  const derived = deriveGardenerMoistureIndexRow(rawRow)
  const state = getHostedGen2SensorPresentationState(rawRow, {
    hasHistory: true,
    latestPackageMeasuredAt: rawRow.measured_at,
    latestPackageIsCurrent: true,
    profileInstalled: true,
    commissioned: true,
  })

  assert.ok((derived.measurement_value ?? 0) < 0)
  assert.equal(getRelativeMoisturePresentation(derived.measurement_value ?? Number.NaN)?.label, 'Too Dry')
  assert.equal(state, 'Current')
})

test('preserves unavailable derived evidence and index-only presentation wording', () => {
  const unavailable = deriveGardenerMoistureIndexRow(row({
    measurement_value: null, valid: false, quality: 'failed', reason: 'sensor_not_detected',
  }))

  assert.equal(unavailable.measurement_value, null)
  assert.equal(unavailable.valid, false)
  assert.equal(unavailable.quality, 'failed')
  assert.equal(unavailable.reason, 'sensor_not_detected')
  assert.equal(getHostedGen2MeasurementDisplay('moisture_index').unitLabel, 'index')
  assert.doesNotMatch(getHostedGen2MeasurementDisplay('moisture_index').unitLabel, /%/)
})
