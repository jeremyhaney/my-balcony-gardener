import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveCommissionedCardEvidence } from '../src/commissionedCardEvidence.ts'
import { evaluateMeasurementPresentationEligibility } from '../src/measurementPresentationEligibility.ts'
import {
  HOSTED_GEN2_CARD_CATALOG,
  type HostedGen2CardCatalogDescriptor,
} from '../src/hostedGen2Presentation.ts'
import type { HostedGen2MeasurementRow } from '../src/types/hostedGen2Measurements.ts'

const descriptor = (key: string): HostedGen2CardCatalogDescriptor => {
  const result = HOSTED_GEN2_CARD_CATALOG.find((candidate) => candidate.key === key)
  assert.ok(result)
  return result
}

const row = (
  card: HostedGen2CardCatalogDescriptor,
  value: number | null,
  overrides: Partial<HostedGen2MeasurementRow> = {},
): HostedGen2MeasurementRow => ({
  device_id: 'device-1', device_key: 'balcony02', device_label: 'Balcony02',
  device_role: 'support_bench', measured_at: '2026-08-17T12:00:00Z',
  firmware_version: null, build_profile: null, record_index: 0,
  sensor_key: card.sensorKey, sensor_type: card.sensorFamily ?? null,
  physical_sensor_id: card.physicalSensorId ?? null,
  measurement_name: card.canonicalMeasurementName, measurement_value: value,
  measurement_unit: card.expectedUnit ?? null, valid: true, quality: 'good',
  reason: 'read_ok', batch_created_at: '2026-08-17T12:00:05Z', ...overrides,
})

const eligibility = (key: string, value: number) => {
  const card = descriptor(key)
  return evaluateMeasurementPresentationEligibility(card, row(card, value))
}

test('uses approved product-context temperature windows inclusively', () => {
  assert.equal(eligibility('air-temperature', 0).presentationEligible, true)
  assert.equal(eligibility('air-temperature', 130).presentationEligible, true)
  assert.equal(eligibility('air-temperature', 362).classification, 'outside-product-plausibility-range')
  assert.equal(eligibility('soil-temperature', 10).presentationEligible, true)
  assert.equal(eligibility('soil-temperature', 130).presentationEligible, true)
  assert.equal(eligibility('soil-temperature', 9.9).classification, 'outside-product-plausibility-range')
})

test('applies exact provider and product contracts without a generic ADC rule', () => {
  assert.equal(eligibility('humidity', 100).presentationEligible, true)
  assert.equal(eligibility('humidity', 100.1).classification, 'outside-provider-measurement-envelope')
  assert.equal(eligibility('atmospheric-pressure', 299).presentationEligible, false)
  assert.equal(eligibility('moisture-m01', 23200).presentationEligible, true)
  assert.equal(eligibility('moisture-m01', 23201).presentationEligible, false)
  assert.equal(eligibility('reservoir-water', 1).presentationEligible, true)
  assert.equal(eligibility('reservoir-water', 2).classification, 'invalid-discrete-value')

  const unrelated = { ...descriptor('moisture-m01'), key: 'unrelated-raw', sensorKey: 'other_adc' }
  assert.equal(
    evaluateMeasurementPresentationEligibility(unrelated, row(unrelated, 50000)).classification,
    'rule-not-defined',
  )
})

test('accepts observed SEN0562 darkness and reports its usable measurement ceiling', () => {
  assert.equal(eligibility('light-l01', 0).presentationEligible, true)
  const ceiling = eligibility('light-l01', 65535)
  assert.equal(ceiling.presentationEligible, true)
  assert.deepEqual(ceiling.concerns, ['measurement-ceiling'])
  assert.equal(eligibility('light-l01', 65536).presentationEligible, false)
})

test('keeps metadata and numeric failures separate from plausibility', () => {
  const card = descriptor('air-temperature')
  assert.equal(
    evaluateMeasurementPresentationEligibility(card, row(card, 72, { valid: false })).classification,
    'device-metadata-unusable',
  )
  assert.equal(
    evaluateMeasurementPresentationEligibility(card, row(card, null)).classification,
    'non-finite',
  )
})

test('preserves device-good evidence while selecting a distinct last presentation-eligible row', () => {
  const card = descriptor('air-temperature')
  const latest = row(card, 362)
  const earlier = row(card, 78, { measured_at: '2026-08-17T11:45:00Z' })
  const evidence = resolveCommissionedCardEvidence(card, [latest, earlier])
  assert.equal(evidence.lastGoodRow, latest)
  assert.equal(evidence.lastPresentationEligibleRow, earlier)
  assert.equal(latest.measurement_value, 362)
})
