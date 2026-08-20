import assert from 'node:assert/strict'
import test from 'node:test'
import { PHASE_7L1_PILOT_CUSTOMER_SITE } from '../src/customerSites.ts'
import { DEVICE_REGISTRY } from '../src/deviceRegistry.ts'

test('Balcony02 is the only source-configured device and the public Demo target', () => {
  assert.deepEqual(DEVICE_REGISTRY, [
    {
      key: 'balcony02',
      label: 'Balcony02',
      hostedLabel: 'Balcony02',
      deviceId: '7e5bd328-ad68-4389-a71a-fa5cd01b3813',
      role: 'controller',
      description: 'Production balcony watering controller.',
    },
  ])
  assert.deepEqual(PHASE_7L1_PILOT_CUSTOMER_SITE.deviceKeys, ['balcony02'])
  assert.equal(PHASE_7L1_PILOT_CUSTOMER_SITE.primaryDeviceKey, 'balcony02')
})
