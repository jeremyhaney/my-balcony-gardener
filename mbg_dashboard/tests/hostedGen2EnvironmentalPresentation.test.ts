import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatHostedGen2CardMeasurementValue,
  REVISED_RMI_CONDITION_BANDS,
  REVISED_RMI_SCALE_BACKGROUND,
  getHostedGen2EnvironmentalPresentation,
  getHostedGen2CardPillLabel,
  getHostedGen2EnvironmentalScale,
  getRelativeMoisturePresentation,
  getReservoirPresentation,
} from '../src/hostedGen2EnvironmentalPresentation.ts'

test('ordinary card measurements use exactly one decimal place', () => {
  assert.match(formatHostedGen2CardMeasurementValue(4726.67, 'lux'), /4,?726\.7 lux$/)
  assert.match(formatHostedGen2CardMeasurementValue(44, '%'), /44\.0 %$/)
  assert.match(formatHostedGen2CardMeasurementValue(1014.35, 'hPa'), /1,?014\.4 hPa$/)
})

const condition = (name: string, value: number) =>
  getHostedGen2EnvironmentalPresentation(name, value)

test('uses exact ambient-light boundaries including darkness and the eligible ceiling', () => {
  assert.deepEqual(condition('ambient_light', 0), { label: 'Very Low Light', tone: 'light-night' })
  assert.equal(condition('ambient_light', 99)?.label, 'Very Low Light')
  assert.equal(condition('ambient_light', 100)?.label, 'Shade')
  assert.equal(condition('ambient_light', 2499)?.label, 'Shade')
  assert.equal(condition('ambient_light', 2500)?.label, 'Filtered Light')
  assert.equal(condition('ambient_light', 9999)?.label, 'Filtered Light')
  assert.equal(condition('ambient_light', 10000)?.label, 'Bright Light')
  assert.equal(condition('ambient_light', 24999)?.label, 'Bright Light')
  assert.equal(condition('ambient_light', 25000)?.label, 'Direct Sun')
  assert.equal(condition('ambient_light', 65535)?.label, 'Direct Sun')
  assert.equal(condition('ambient_light', -1), null)
  assert.equal(condition('ambient_light', 65536), null)
})

test('keeps air and soil temperature terminology distinct at every boundary', () => {
  assert.equal(condition('air_temperature', 0)?.label, 'Very Cold')
  assert.equal(condition('air_temperature', 39)?.label, 'Very Cold')
  assert.equal(condition('air_temperature', 40)?.label, 'Cool')
  assert.equal(condition('air_temperature', 54)?.label, 'Cool')
  assert.equal(condition('air_temperature', 55)?.label, 'Mild')
  assert.equal(condition('air_temperature', 84)?.label, 'Mild')
  assert.equal(condition('air_temperature', 85)?.label, 'Hot')
  assert.equal(condition('air_temperature', 94)?.label, 'Hot')
  assert.equal(condition('air_temperature', 95)?.label, 'Extreme Heat')
  assert.equal(condition('air_temperature', 130)?.label, 'Extreme Heat')
  assert.equal(condition('air_temperature', -1), null)
  assert.equal(condition('air_temperature', 131), null)

  assert.deepEqual(condition('feels_like', 95), condition('air_temperature', 95))
  assert.deepEqual(condition('feels_like', 65), condition('air_temperature', 65))

  assert.equal(condition('soil temp', 10)?.label, 'Cold Root Zone')
  assert.equal(condition('soil temp', 39)?.label, 'Cold Root Zone')
  assert.equal(condition('soil temp', 40)?.label, 'Cool Root Zone')
  assert.equal(condition('soil temp', 54)?.label, 'Cool Root Zone')
  assert.equal(condition('soil temp', 55)?.label, 'Active Root Zone')
  assert.equal(condition('soil temp', 84)?.label, 'Active Root Zone')
  assert.equal(condition('soil temp', 85)?.label, 'Warm Root Zone')
  assert.equal(condition('soil temp', 94)?.label, 'Warm Root Zone')
  assert.equal(condition('soil temp', 95)?.label, 'Hot Root Zone')
  assert.equal(condition('soil temp', 130)?.label, 'Hot Root Zone')
  assert.equal(condition('soil temp', 9), null)
  assert.equal(condition('soil temp', 131), null)
})

test('uses weather-style dew-point comfort bands instead of air-temperature wording', () => {
  assert.equal(condition('dew_point', -49)?.label, 'Dry & Comfortable')
  assert.equal(condition('dew_point', 55)?.label, 'Dry & Comfortable')
  assert.equal(condition('dew_point', 55.01)?.label, 'Getting Muggy')
  assert.equal(condition('dew_point', 64.99)?.label, 'Getting Muggy')
  assert.equal(condition('dew_point', 65)?.label, 'Muggy')
  assert.equal(condition('dew_point', 74.99)?.label, 'Muggy')
  assert.equal(condition('dew_point', 75)?.label, 'Very Muggy')
  assert.equal(condition('dew_point', 140)?.label, 'Very Muggy')
  assert.equal(condition('dew_point', -50), null)
  assert.equal(condition('dew_point', 141), null)
})

test('uses exact humidity bands and a non-judgmental pressure presentation', () => {
  assert.equal(condition('relative_humidity', 0)?.label, 'Very Dry')
  assert.equal(condition('relative_humidity', 24)?.label, 'Very Dry')
  assert.equal(condition('relative_humidity', 25)?.label, 'Dry')
  assert.equal(condition('relative_humidity', 34)?.label, 'Dry')
  assert.equal(condition('relative_humidity', 35)?.label, 'Moderate Humidity')
  assert.equal(condition('relative_humidity', 69)?.label, 'Moderate Humidity')
  assert.equal(condition('relative_humidity', 70)?.label, 'Humid')
  assert.equal(condition('relative_humidity', 84)?.label, 'Humid')
  assert.equal(condition('relative_humidity', 85)?.label, 'Very Humid')
  assert.equal(condition('relative_humidity', 100)?.label, 'Very Humid')
  assert.equal(condition('relative_humidity', -1), null)
  assert.equal(condition('relative_humidity', 101), null)

  assert.deepEqual(condition('barometric_pressure', 300), { label: 'Local Pressure', tone: 'env-purple' })
  assert.deepEqual(condition('barometric_pressure', 1100), { label: 'Local Pressure', tone: 'env-purple' })
  assert.equal(condition('barometric_pressure', 299), null)
  assert.equal(condition('barometric_pressure', 1101), null)
})

test('uses the revised exact unclamped RMI condition boundaries', () => {
  const cases: ReadonlyArray<[number, string]> = [
    [-1, 'Too Dry'], [34.99, 'Too Dry'], [35, 'Too Dry'], [35.01, 'Dry'],
    [54.99, 'Dry'], [55, 'Dry'], [55.01, 'Moist'], [99.99, 'Moist'],
    [100, 'Well-watered'], [100.01, 'Well-watered'], [224.99, 'Well-watered'],
    [225, 'Well-watered'], [225.01, 'Very Wet'], [234.99, 'Very Wet'],
    [235, 'Saturated'], [235.01, 'Saturated'], [300, 'Saturated'],
  ]

  for (const [value, expectedLabel] of cases) {
    assert.equal(getRelativeMoisturePresentation(value)?.label, expectedLabel, `RMI ${value}`)
  }

  assert.deepEqual(getRelativeMoisturePresentation(-1), {
    label: 'Too Dry', tone: 'moisture-too-dry',
  })
  assert.deepEqual(getRelativeMoisturePresentation(36), {
    label: 'Dry', tone: 'moisture-dry',
  })
  assert.deepEqual(getRelativeMoisturePresentation(56), {
    label: 'Moist', tone: 'moisture-moist',
  })
  assert.deepEqual(getRelativeMoisturePresentation(100), {
    label: 'Well-watered', tone: 'moisture-well-watered',
  })
  assert.deepEqual(getRelativeMoisturePresentation(225.01), {
    label: 'Very Wet', tone: 'moisture-very-wet',
  })
  assert.deepEqual(getRelativeMoisturePresentation(235), {
    label: 'Saturated', tone: 'moisture-saturated',
  })

  assert.deepEqual(REVISED_RMI_CONDITION_BANDS.map(({ upperBound, upperInclusive, label }) => ({
    upperBound, upperInclusive, label,
  })), [
    { upperBound: 35, upperInclusive: true, label: 'Too Dry' },
    { upperBound: 55, upperInclusive: true, label: 'Dry' },
    { upperBound: 100, upperInclusive: false, label: 'Moist' },
    { upperBound: 225, upperInclusive: true, label: 'Well-watered' },
    { upperBound: 235, upperInclusive: false, label: 'Very Wet' },
    { upperBound: null, upperInclusive: true, label: 'Saturated' },
  ])
})

test('provides a complete scale and bounded current-position marker for every card family', () => {
  assert.deepEqual(getHostedGen2EnvironmentalScale('moisture_index', 0), {
    key: 'moisture', label: 'Moisture scale from overdue-dry to saturated', positionPercent: 0,
    background: REVISED_RMI_SCALE_BACKGROUND,
  })
  assert.equal(getHostedGen2EnvironmentalScale('moisture_index', 35).positionPercent, 100 / 6)
  assert.equal(getHostedGen2EnvironmentalScale('moisture_index', 55).positionPercent, 200 / 6)
  assert.equal(getHostedGen2EnvironmentalScale('moisture_index', 100).positionPercent, 50)
  assert.equal(getHostedGen2EnvironmentalScale('moisture_index', 225).positionPercent, 400 / 6)
  assert.ok((getHostedGen2EnvironmentalScale('moisture_index', 225.01).positionPercent ?? 0) > 400 / 6)
  assert.ok(Math.abs(
    (getHostedGen2EnvironmentalScale('moisture_index', 235).positionPercent ?? 0) - 500 / 6,
  ) < Number.EPSILON * 100)
  assert.equal(getHostedGen2EnvironmentalScale('moisture_index', 250).positionPercent, 100)
  assert.equal(getHostedGen2EnvironmentalScale('moisture_index', 300).positionPercent, 100)
  assert.equal(getHostedGen2EnvironmentalScale('moisture_index', 100).background, REVISED_RMI_SCALE_BACKGROUND)
  assert.equal(getHostedGen2EnvironmentalScale('ambient_light', 0).positionPercent, 0)
  assert.equal(getHostedGen2EnvironmentalScale('ambient_light', 99).positionPercent, 19.8)
  assert.equal(getHostedGen2EnvironmentalScale('ambient_light', 100).positionPercent, 20)
  assert.equal(getHostedGen2EnvironmentalScale('ambient_light', 2500).positionPercent, 40)
  assert.ok(Math.abs((getHostedGen2EnvironmentalScale('ambient_light', 3335).positionPercent ?? 0) - 42.2267) < 0.001)
  assert.equal(getHostedGen2EnvironmentalScale('ambient_light', 10000).positionPercent, 60)
  assert.equal(getHostedGen2EnvironmentalScale('ambient_light', 25000).positionPercent, 80)
  assert.equal(getHostedGen2EnvironmentalScale('ambient_light', 65535).positionPercent, 100)
  assert.equal(getHostedGen2EnvironmentalScale('air_temperature', 65).positionPercent, 50)
  assert.equal(getHostedGen2EnvironmentalScale('feels_like', 65).key, 'air-temperature')
  assert.equal(getHostedGen2EnvironmentalScale('feels_like', 65).positionPercent, 50)
  assert.equal(getHostedGen2EnvironmentalScale('dew_point', 42.5).key, 'dew-point')
  assert.equal(getHostedGen2EnvironmentalScale('dew_point', 42.5).positionPercent, 50)
  assert.equal(getHostedGen2EnvironmentalScale('relative_humidity', 50).positionPercent, 50)
  assert.equal(getHostedGen2EnvironmentalScale('barometric_pressure', null).positionPercent, null)
  assert.equal(getHostedGen2EnvironmentalScale('soil temp', 70).positionPercent, 50)
  assert.equal(getHostedGen2EnvironmentalScale('reservoir_liquid_detected', 1).positionPercent, 100)
  assert.equal(getHostedGen2EnvironmentalScale('unknown', 1).key, 'neutral')
})

test('keeps the reservoir contract exact and rejects unknown measurements', () => {
  assert.deepEqual(getReservoirPresentation(0), { label: 'Refill Reservoir', tone: 'env-red' })
  assert.deepEqual(getReservoirPresentation(1), { label: 'Water Detected', tone: 'reservoir-water' })
  assert.equal(getReservoirPresentation(2), null)
  assert.equal(condition('raw_adc', 12000), null)
  assert.equal(condition('unknown', 1), null)
  assert.equal(condition('air_temperature', Number.NaN), null)
})

test('uses the condition as the healthy pill and reserves evidence wording for exceptions', () => {
  assert.equal(getHostedGen2CardPillLabel({
    conditionLabel: 'Direct Sun', evidenceLabel: 'Current', evidenceIsCurrent: true,
  }), 'Direct Sun')
  assert.equal(getHostedGen2CardPillLabel({
    conditionLabel: 'Filtered Light', evidenceLabel: 'Last Reliable', evidenceIsCurrent: false,
  }), 'Last Reliable')
  assert.equal(getHostedGen2CardPillLabel({
    conditionLabel: null, evidenceLabel: 'Current', evidenceIsCurrent: true,
  }), null)
  assert.equal(getHostedGen2CardPillLabel({
    conditionLabel: null, evidenceLabel: 'Reading Unavailable', evidenceIsCurrent: false,
  }), 'Reading Unavailable')
})
