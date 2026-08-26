import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAdaptiveScaleBackground,
  getHostedGen2AdaptiveScaleBackground,
  getHostedGen2EnvironmentalScale,
} from '../src/hostedGen2EnvironmentalPresentation.ts'

test('adaptive scale makes the current environmental neighborhood dominant', () => {
  assert.equal(
    buildAdaptiveScaleBackground(['low', 'current', 'high'], 50),
    'linear-gradient(90deg, low 0%, low 10%, current 24%, current 76%, high 90%, high 100%)',
  )
})

test('environmental scales expose an adaptive card background but reservoir stays binary', () => {
  const light = getHostedGen2EnvironmentalScale('ambient_light', 7000)
  const reservoir = getHostedGen2EnvironmentalScale('reservoir_liquid_detected', 1)

  assert.equal(light.key, 'light')
  assert.match(getHostedGen2AdaptiveScaleBackground('ambient_light', 7000) ?? '', /^linear-gradient/)
  assert.equal(reservoir.key, 'reservoir')
  assert.equal(getHostedGen2AdaptiveScaleBackground('reservoir_liquid_detected', 1), undefined)
})
