import assert from 'node:assert/strict'
import test from 'node:test'
import type { HostedWateringEventRow } from '../src/api.ts'
import {
  formatWateringCycleDuration,
  getHostedWateringCycles,
} from '../src/hostedWateringCycles.ts'

const deviceId = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'

const wateringEvent = (
  id: string,
  eventAt: string,
  eventType: HostedWateringEventRow['event_type'],
  triggerSource: HostedWateringEventRow['trigger_source'],
  durationSeconds: number | null,
  reason: string,
  createdAt = eventAt,
): HostedWateringEventRow => ({
  id,
  device_id: deviceId,
  device_key: 'balcony02',
  device_label: 'Balcony02',
  event_at: eventAt,
  event_type: eventType,
  trigger_source: triggerSource,
  duration_seconds: durationSeconds,
  reason,
  firmware_version: 'phase8b4-gen2-status-contract',
  build_profile: 'balcony02-gen2',
  details: { source: 'firmware' },
  created_at: createdAt,
})

test('pairs a terminal event with its recorded start instead of reconstructing a shifted timestamp', () => {
  const cycles = getHostedWateringCycles([
    wateringEvent(
      'completed',
      '2026-08-19T18:47:46Z',
      'watering_completed',
      'physical_button',
      6,
      'physical_button_released',
      '2026-08-19T18:47:49.797534Z',
    ),
    wateringEvent(
      'started',
      '2026-08-19T18:47:39Z',
      'watering_started',
      'physical_button',
      null,
      'physical_button_pressed',
      '2026-08-19T18:47:48.295971Z',
    ),
  ])

  assert.equal(cycles.length, 1)
  assert.equal(cycles[0].startEventId, 'started')
  assert.equal(cycles[0].startAt, '2026-08-19T18:47:39.000Z')
  assert.equal(cycles[0].startTimeSource, 'event')
  assert.equal(cycles[0].endedAt, '2026-08-19T18:47:46Z')
})

test('includes and distinguishes button timeout and reservoir safety terminals', () => {
  const cycles = getHostedWateringCycles([
    wateringEvent('timeout-start', '2026-08-19T17:50:48Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('timeout', '2026-08-19T17:51:03Z', 'watering_safety_cutoff', 'firmware_safety', 15, 'physical_button_hold_timeout'),
    wateringEvent('reservoir-start', '2026-08-19T17:52:17Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('reservoir', '2026-08-19T17:52:22Z', 'watering_safety_cutoff', 'firmware_safety', 5, 'reservoir_liquid_lost'),
  ])

  const reservoir = cycles.find((cycle) => cycle.id === 'reservoir')
  const timeout = cycles.find((cycle) => cycle.id === 'timeout')

  assert.deepEqual(
    reservoir && {
      label: reservoir.displayReason,
      marker: reservoir.markerLabel,
      tone: reservoir.tone,
      color: reservoir.markerColor,
      type: reservoir.terminalEventType,
    },
    {
      label: 'Reservoir Safety Stop',
      marker: 'Reservoir Safety Stop · 5s',
      tone: 'reservoir-safety',
      color: '#be123c',
      type: 'watering_safety_cutoff',
    },
  )
  assert.deepEqual(
    timeout && {
      label: timeout.displayReason,
      marker: timeout.markerLabel,
      tone: timeout.tone,
      color: timeout.markerColor,
    },
    {
      label: 'Button Safety Cutoff',
      marker: 'Button Safety Cutoff · 15s',
      tone: 'timeout-safety',
      color: '#a16207',
    },
  )
})

test('presents firmware-truncated zero duration honestly as a sub-second cycle', () => {
  const cycles = getHostedWateringCycles([
    wateringEvent('quick-start', '2026-08-19T18:46:43Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('quick-end', '2026-08-19T18:46:44Z', 'watering_completed', 'physical_button', 0, 'physical_button_released'),
  ])

  assert.equal(cycles[0].displayReason, 'Button Watering')
  assert.equal(cycles[0].markerLabel, 'Button Watering · <1s')
  assert.equal(formatWateringCycleDuration(cycles[0].durationSeconds), 'Under 1 second')
})

test('distinguishes programmed button completion and local cancellation', () => {
  const cycles = getHostedWateringCycles([
    wateringEvent('cycle-start', '2026-08-24T12:00:00Z', 'watering_started', 'physical_button', null, 'physical_button_program_30s_started'),
    wateringEvent('cycle-end', '2026-08-24T12:00:30Z', 'watering_completed', 'physical_button', 30, 'physical_button_program_completed'),
    wateringEvent('stop-start', '2026-08-24T12:01:00Z', 'watering_started', 'physical_button', null, 'physical_button_program_60s_started'),
    wateringEvent('stop-end', '2026-08-24T12:01:12Z', 'watering_completed', 'physical_button', 12, 'physical_button_cancelled'),
  ])

  assert.deepEqual(
    cycles.map((cycle) => cycle.markerLabel),
    ['Button Stop · 12s', 'Button Cycle · 30s'],
  )
})

test('preserves all seven production-evidence cycles without collapsing safety cutoffs', () => {
  const productionEvidence: HostedWateringEventRow[] = [
    wateringEvent('s1', '2026-08-19T17:50:48Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('e1', '2026-08-19T17:51:03Z', 'watering_safety_cutoff', 'firmware_safety', 15, 'physical_button_hold_timeout'),
    wateringEvent('s2', '2026-08-19T17:51:22Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('e2', '2026-08-19T17:51:37Z', 'watering_safety_cutoff', 'firmware_safety', 15, 'physical_button_hold_timeout'),
    wateringEvent('s3', '2026-08-19T17:51:54Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('e3', '2026-08-19T17:52:09Z', 'watering_safety_cutoff', 'firmware_safety', 15, 'physical_button_hold_timeout'),
    wateringEvent('s4', '2026-08-19T17:52:17Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('e4', '2026-08-19T17:52:22Z', 'watering_safety_cutoff', 'firmware_safety', 5, 'reservoir_liquid_lost'),
    wateringEvent('s5', '2026-08-19T17:52:32Z', 'watering_started', 'physical_button', null, 'physical_button_pressed', '2026-08-19T17:52:34.239577Z'),
    wateringEvent('e5', '2026-08-19T17:52:32Z', 'watering_completed', 'physical_button', 0, 'physical_button_released', '2026-08-19T17:52:35.663307Z'),
    wateringEvent('s6', '2026-08-19T18:46:43Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('e6', '2026-08-19T18:46:44Z', 'watering_completed', 'physical_button', 0, 'physical_button_released'),
    wateringEvent('s7', '2026-08-19T18:47:39Z', 'watering_started', 'physical_button', null, 'physical_button_pressed'),
    wateringEvent('e7', '2026-08-19T18:47:46Z', 'watering_completed', 'physical_button', 6, 'physical_button_released'),
  ]

  const cycles = getHostedWateringCycles(productionEvidence.reverse())

  assert.equal(cycles.length, 7)
  assert.deepEqual(cycles.map((cycle) => cycle.id), ['e7', 'e6', 'e5', 'e4', 'e3', 'e2', 'e1'])
  assert.equal(cycles.filter((cycle) => cycle.terminalEventType === 'watering_safety_cutoff').length, 4)
  assert.equal(cycles.filter((cycle) => cycle.terminalEventType === 'watering_completed').length, 3)
  assert.equal(cycles.every((cycle) => cycle.startTimeSource === 'event'), true)
})

test('uses an explicit approximate fallback at a query boundary and ignores non-cycle rows', () => {
  const cycles = getHostedWateringCycles([
    wateringEvent('boundary-end', '2026-08-19T18:00:15Z', 'watering_completed', 'physical_button', 15, 'physical_button_released'),
    wateringEvent('blocked', '2026-08-19T18:01:00Z', 'watering_blocked', 'firmware_safety', 0, 'reservoir_liquid_lost'),
    wateringEvent('missing-duration', '2026-08-19T18:02:00Z', 'watering_completed', 'physical_button', null, 'physical_button_released'),
    wateringEvent('invalid-time', 'not-a-time', 'watering_completed', 'physical_button', 2, 'physical_button_released'),
  ])

  assert.equal(cycles.length, 1)
  assert.equal(cycles[0].startEventId, null)
  assert.equal(cycles[0].startTimeSource, 'reconstructed')
  assert.equal(cycles[0].startAt, '2026-08-19T18:00:00.000Z')
})
