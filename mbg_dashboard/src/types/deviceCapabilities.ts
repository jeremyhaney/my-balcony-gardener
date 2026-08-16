export type CommissionedDeviceCapability = {
  deviceId: string
  logicalSensorKey: string
  sensorFamily: string
  logicalChannel: string
  expectedMeasurementNames: string[]
  friendlyName: string | null
  locationLabel: string | null
  physicalSensorId: string | null
  effectiveFrom: string
  effectiveTo: string | null
}

export type SupportDeviceCapabilityRow = {
  device_id: string
  logical_sensor_key: string
  sensor_family: string
  logical_channel: string
  expected_measurement_names: string[]
  friendly_name: string | null
  location_label: string | null
  physical_sensor_id: string | null
  effective_from: string
  effective_to: string | null
}
