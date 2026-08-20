export type DeviceKey = 'balcony02'
export type DeviceRole = 'controller'

export type RegisteredDevice = {
  key: DeviceKey
  label: string
  hostedLabel: string
  deviceId: string
  role: DeviceRole
  description: string
}

export const DEVICE_REGISTRY: readonly RegisteredDevice[] = [
  {
    key: 'balcony02',
    label: 'Balcony02',
    hostedLabel: 'Balcony02',
    deviceId: '7e5bd328-ad68-4389-a71a-fa5cd01b3813',
    role: 'controller',
    description: 'Production balcony watering controller.',
  },
]
