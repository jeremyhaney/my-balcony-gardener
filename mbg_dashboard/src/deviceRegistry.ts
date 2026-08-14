export type DeviceKey = 'balcony' | 'balcony02' | 'bench' | 'scout01'
export type DeviceRole = 'controller' | 'bench' | 'sensor-scout'

export type RegisteredDevice = {
  key: DeviceKey
  label: string
  hostedLabel: string
  deviceId: string
  role: DeviceRole
  description: string
}

export const DEVICE_REGISTRY: RegisteredDevice[] = [
  {
    key: 'balcony',
    label: 'Installed Balcony Unit',
    hostedLabel: 'Balcony01',
    deviceId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'controller',
    description: 'Real installed balcony watering controller.',
  },
  {
    key: 'balcony02',
    label: 'Balcony02',
    hostedLabel: 'Balcony02',
    deviceId: '7e5bd328-ad68-4389-a71a-fa5cd01b3813',
    role: 'controller',
    description: 'Production balcony watering controller.',
  },
  {
    key: 'bench',
    label: 'Bench Test Unit',
    hostedLabel: 'Bench01',
    deviceId: '318fab98-89ad-4f36-9100-3134a04e0be5',
    role: 'bench',
    description: 'Bench test unit. Do not use for real-world plant watering.',
  },
  {
    key: 'scout01',
    label: 'Balcony Sensor Scout 01',
    hostedLabel: 'Scout01',
    deviceId: '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    role: 'sensor-scout',
    description: 'Temporary balcony sensor-only comparison unit.',
  },
]

export const getDeviceById = (deviceId: string): RegisteredDevice | undefined => {
  const normalizedDeviceId = deviceId.trim().toLowerCase()

  return DEVICE_REGISTRY.find(
    (device) => device.deviceId.toLowerCase() === normalizedDeviceId,
  )
}
