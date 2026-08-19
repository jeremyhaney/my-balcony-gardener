import assert from 'node:assert/strict'
import test from 'node:test'
import {
  COMMISSIONED_ACTIONABLE_AGE_MS,
  COMMISSIONED_FRESHNESS_LIMIT_MS,
  evaluateCommissionedEvidencePolicy,
} from '../src/commissionedEvidencePolicy.ts'
import { calculateHostedGen2Health } from '../src/hostedGen2Health.ts'
import type { HostedGen2CardCatalogDescriptor } from '../src/hostedGen2Presentation.ts'
import type { HostedGen2MeasurementRow } from '../src/types/hostedGen2Measurements.ts'

const descriptor: HostedGen2CardCatalogDescriptor = {
  key: 'moisture-m01', section: 'earth', label: 'Moisture M01',
  sensorKey: 'sen0308_m01', canonicalMeasurementName: 'raw_adc',
  compatibleMeasurementNames: ['raw_adc'], expectedUnit: 'count', order: 1,
  isCommissioned: true,
}

const row = (overrides: Partial<HostedGen2MeasurementRow> = {}): HostedGen2MeasurementRow => ({
  batch_id: '10000000-0000-4000-8000-000000000001',
  device_id: 'device-1', device_key: 'balcony02', device_label: 'Balcony02',
  device_role: 'support_bench', measured_at: '2026-08-16T12:00:00Z',
  firmware_version: null, build_profile: null, record_index: 0,
  sensor_key: 'sen0308_m01', sensor_type: 'sen0308', physical_sensor_id: 'SEN0308-M01',
  measurement_name: 'raw_adc', measurement_value: 12000, measurement_unit: 'count',
  valid: true, quality: 'good', reason: null, batch_created_at: '2026-08-16T12:00:05Z',
  ...overrides,
})

const evaluate = (
  rows: HostedGen2MeasurementRow[],
  nowMs = Date.parse('2026-08-16T12:01:00Z'),
  deviceReportingActive = true,
) => {
  const matchingRows = rows.filter((candidate) => candidate.sensor_key === descriptor.sensorKey)
    .sort((left, right) => Date.parse(right.measured_at) - Date.parse(left.measured_at))
  const latest = matchingRows[0] ?? null
  const lastGood = matchingRows.find((candidate) => candidate.valid === true &&
    candidate.quality === 'good' && typeof candidate.measurement_value === 'number') ?? null
  const latestPackageTime = rows.reduce(
    (latestTime, candidate) => Math.max(latestTime, Date.parse(candidate.measured_at)),
    Number.NEGATIVE_INFINITY,
  )
  return evaluateCommissionedEvidencePolicy({
    descriptor, rows, latestMatchingRow: latest, lastGoodRow: lastGood,
    appearsInLatestPackage: Boolean(latest && Date.parse(latest.measured_at) === latestPackageTime),
    deviceReportingActive, nowMs,
  })
}

test('uses approved 50-minute freshness and 95-minute actionable boundaries', () => {
  assert.equal(COMMISSIONED_FRESHNESS_LIMIT_MS, 50 * 60 * 1000)
  assert.equal(COMMISSIONED_ACTIONABLE_AGE_MS, 95 * 60 * 1000)
  const evidence = row()
  assert.equal(evaluate([evidence], Date.parse(evidence.measured_at) + COMMISSIONED_FRESHNESS_LIMIT_MS).label, 'Current')
  assert.equal(evaluate([evidence], Date.parse(evidence.measured_at) + COMMISSIONED_FRESHNESS_LIMIT_MS + 1).label, 'Not Current')
  assert.equal(evaluate([evidence], Date.parse(evidence.measured_at) + COMMISSIONED_ACTIONABLE_AGE_MS + 1).label, 'Check Sensor')
  assert.equal(evaluate([evidence], Date.parse(evidence.measured_at) + COMMISSIONED_ACTIONABLE_AGE_MS + 1, false).label, 'Not Current')
})

test('retains environmental condition currency through the inclusive 50-minute boundary', () => {
  const evidence = row()
  const measuredAtMs = Date.parse(evidence.measured_at)

  for (const ageMinutes of [15, 30, 45, 50]) {
    assert.equal(
      evaluate([evidence], measuredAtMs + ageMinutes * 60 * 1000).conditionIsCurrent,
      true,
    )
  }

  assert.equal(
    evaluate([evidence], measuredAtMs + COMMISSIONED_FRESHNESS_LIMIT_MS + 1).conditionIsCurrent,
    false,
  )
})

test('one invalid is informational, two are caution, and usable evidence resets the run', () => {
  const good = row({ measured_at: '2026-08-16T11:30:00Z' })
  const invalid1 = row({ measured_at: '2026-08-16T11:45:00Z', valid: false, quality: 'failed', measurement_value: null })
  const invalid2 = row({ measured_at: '2026-08-16T12:00:00Z', valid: false, quality: 'failed', measurement_value: null })
  assert.equal(evaluate([invalid1, good]).severity, 'informational')
  const repeated = evaluate([invalid2, invalid1, good])
  assert.equal(repeated.invalidCount.count, 2)
  assert.equal(repeated.severity, 'caution')
  assert.equal(evaluate([row(), invalid2, invalid1]).invalidCount.count, 0)
})

test('one or two omissions are informational and three are caution with bounded labeling', () => {
  const good = row({ measured_at: '2026-08-16T11:15:00Z' })
  const other = (measured_at: string) => row({
    measured_at, sensor_key: 'sen0308_m02', physical_sensor_id: 'SEN0308-M02',
  })
  assert.equal(evaluate([other('2026-08-16T11:30:00Z'), good]).severity, 'informational')
  assert.equal(evaluate([other('2026-08-16T11:45:00Z'), other('2026-08-16T11:30:00Z'), good]).severity, 'informational')
  const repeated = evaluate([
    other('2026-08-16T12:00:00Z'), other('2026-08-16T11:45:00Z'),
    other('2026-08-16T11:30:00Z'), good,
  ])
  assert.equal(repeated.omissionCount.count, 3)
  assert.equal(repeated.severity, 'caution')
  const truncated = evaluate([
    other('2026-08-16T12:00:00Z'), other('2026-08-16T11:45:00Z'),
  ])
  assert.equal(truncated.omissionCount.isLowerBound, true)
})

test('future and unparseable measurement times are not current', () => {
  assert.equal(evaluate([row({ measured_at: '2026-08-16T13:00:00Z' })]).conditionIsCurrent, false)
  const unparseable = row({ measured_at: 'not-a-time' })
  const policy = evaluateCommissionedEvidencePolicy({
    descriptor, rows: [unparseable], latestMatchingRow: unparseable,
    lastGoodRow: unparseable, appearsInLatestPackage: true,
    deviceReportingActive: true, nowMs: Date.parse('2026-08-16T12:00:00Z'),
  })
  assert.equal(policy.label, 'Not Current')
})

test('derived RMI is unavailable without usable raw evidence and preserves honest fault severity', () => {
  const noEvidence = evaluateCommissionedEvidencePolicy({
    descriptor, rows: [], latestMatchingRow: null, lastGoodRow: null,
    appearsInLatestPackage: false, deviceReportingActive: true,
    derivedValueAvailable: false, nowMs: Date.parse('2026-08-16T12:00:00Z'),
  })
  assert.equal(noEvidence.reason, 'derived-unavailable')
  assert.equal(noEvidence.label, 'Derived value unavailable')
  assert.equal(noEvidence.detail, null)
  assert.equal(noEvidence.severity, 'neutral')
  assert.equal(noEvidence.conditionIsCurrent, false)

  const invalid1 = row({
    measured_at: '2026-08-16T11:45:00Z', valid: false,
    quality: 'failed', measurement_value: null,
  })
  const invalid2 = row({
    measured_at: '2026-08-16T12:00:00Z', valid: false,
    quality: 'failed', measurement_value: null,
  })
  const repeatedInvalid = evaluateCommissionedEvidencePolicy({
    descriptor, rows: [invalid2, invalid1], latestMatchingRow: invalid2,
    lastGoodRow: null, appearsInLatestPackage: true,
    deviceReportingActive: true, derivedValueAvailable: false,
    nowMs: Date.parse('2026-08-16T12:01:00Z'),
  })
  assert.equal(repeatedInvalid.reason, 'derived-unavailable')
  assert.equal(repeatedInvalid.label, 'Derived value unavailable')
  assert.equal(repeatedInvalid.detail, 'Latest reading invalid')
  assert.equal(repeatedInvalid.severity, 'caution')
  assert.equal(repeatedInvalid.invalidCount.count, 2)
  assert.equal(repeatedInvalid.invalidCount.isLowerBound, true)
  assert.equal(repeatedInvalid.conditionIsCurrent, false)
})

test('fault policy labels and condition currency remain separate', () => {
  const good = row({ measured_at: '2026-08-16T11:30:00Z' })
  const invalid = row({
    measured_at: '2026-08-16T11:45:00Z', valid: false,
    quality: 'failed', measurement_value: null,
  })
  const invalidPolicy = evaluate([invalid, good])
  assert.equal(invalidPolicy.reason, 'invalid')
  assert.equal(invalidPolicy.label, 'Last Good')
  assert.equal(invalidPolicy.detail, 'Latest reading invalid')
  assert.equal(invalidPolicy.conditionIsCurrent, true)

  const other = row({
    measured_at: '2026-08-16T12:00:00Z', sensor_key: 'sen0308_m02',
    physical_sensor_id: 'SEN0308-M02',
  })
  const omittedPolicy = evaluate([other, good])
  assert.equal(omittedPolicy.reason, 'omitted')
  assert.equal(omittedPolicy.label, 'Last Good')
  assert.equal(omittedPolicy.detail, 'Missing from latest update')
  assert.equal(omittedPolicy.conditionIsCurrent, true)

  const stalePolicy = evaluate(
    [good],
    Date.parse(good.measured_at) + COMMISSIONED_FRESHNESS_LIMIT_MS + 1,
    false,
  )
  assert.equal(stalePolicy.reason, 'not-current')
  assert.equal(stalePolicy.label, 'Not Current')
  assert.equal(stalePolicy.detail, 'Device reporting unavailable')
  assert.equal(stalePolicy.conditionIsCurrent, false)
})

test('presentation rejection uses distinct last-reliable evidence without rewriting device-good metadata', () => {
  const latest = row({ measured_at: '2026-08-16T12:00:00Z', measurement_value: 24000 })
  const lastEligible = row({ measured_at: '2026-08-16T11:45:00Z', measurement_value: 12000 })
  const policy = evaluateCommissionedEvidencePolicy({
    descriptor, rows: [latest, lastEligible], latestMatchingRow: latest,
    lastGoodRow: latest, lastPresentationEligibleRow: lastEligible,
    latestPresentationEligible: false,
    latestPresentationDetail: 'Latest reading outside the provider measurement envelope',
    appearsInLatestPackage: true, deviceReportingActive: true,
    nowMs: Date.parse('2026-08-16T12:01:00Z'),
  })
  assert.equal(policy.reason, 'presentation-ineligible')
  assert.equal(policy.label, 'Last Reliable')
  assert.equal(policy.conditionIsCurrent, true)
  assert.equal(policy.lastGoodAgeMs, 16 * 60 * 1000)
  assert.equal(latest.valid, true)
  assert.equal(latest.quality, 'good')
})

test('capability-driven health uses only provided commissioned descriptors', () => {
  const health = calculateHostedGen2Health([row()], '24h', new Date('2026-08-16T12:01:00Z'), [descriptor])
  assert.equal(health.sensorAvailability.expectedEntryCount, 1)
  assert.equal(health.latestReadingChecks.expectedEntryCount, 1)
  const zero = calculateHostedGen2Health([row()], '24h', new Date('2026-08-16T12:01:00Z'), [])
  assert.equal(zero.sensorAvailability.expectedEntryCount, 0)
  assert.equal(zero.latestReadingChecks.expectedEntryCount, 0)
})
