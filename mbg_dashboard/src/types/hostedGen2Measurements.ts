export type HostedGen2MeasurementRow = {
  device_id: string
  device_key: string | null
  device_label: string | null
  device_role: string | null
  measured_at: string
  firmware_version: string | null
  build_profile: string | null
  record_index: number
  sensor_key: string | null
  sensor_type: string | null
  physical_sensor_id: string | null
  measurement_name: string | null
  measurement_value: number | null
  measurement_unit: string | null
  valid: boolean | null
  quality: string | null
  reason: string | null
  batch_created_at: string | null
}
