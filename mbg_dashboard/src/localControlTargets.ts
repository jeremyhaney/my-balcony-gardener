import type { DeviceKey } from './deviceRegistry'

export type LocalControlTarget = {
  deviceKey: DeviceKey
  expectedLocalIp: string
  manualActionAllowed: boolean
  manualActionLabel: string
  manualActionSuccessMessage: string
  manualActionSafetyText: string
  warningText: string
}

export const LOCAL_CONTROL_TARGETS: LocalControlTarget[] = [
  {
    deviceKey: 'balcony',
    expectedLocalIp: '10.0.0.200',
    manualActionAllowed: true,
    manualActionLabel: 'Water Now',
    manualActionSuccessMessage: 'Manual watering triggered for Installed Balcony Unit.',
    manualActionSafetyText: 'Manual plant watering is allowed only for the installed controller.',
    warningText: 'Real installed balcony watering controller.',
  },
  {
    deviceKey: 'bench',
    expectedLocalIp: '10.0.0.192',
    manualActionAllowed: true,
    manualActionLabel: 'Test Relay',
    manualActionSuccessMessage: 'Relay test triggered for Bench Prototype Unit.',
    manualActionSafetyText: 'Bench relay testing only. This is not a plant watering command.',
    warningText: 'Bench test unit. Do not use for real-world plant watering.',
  },
  {
    deviceKey: 'scout01',
    expectedLocalIp: '10.0.0.180',
    manualActionAllowed: false,
    manualActionLabel: 'Manual Action',
    manualActionSuccessMessage: '',
    manualActionSafetyText: 'Sensor-only scout: no relay or pump command authority.',
    warningText: 'Temporary balcony sensor-only comparison unit.',
  },
]
