export type LocalStatusResponse = {
  device_id: string
  uptime_seconds: number
  wifi_connected: boolean
  wifi_rssi: number | null
  currently_watering: boolean
  lastWateredTime: string
  lastWateringDuration: number
  hasLastGoodDht: boolean
  free_heap: number
  min_free_heap: number
  ip_address: string
  mac_address: string
}

export type CapabilityModule = {
  sensor_key: string
  sensor_type: string
  enabled: boolean
  present: boolean
  quality: string
  reason: string
  control_eligible: boolean
  details: Record<string, unknown>
}

export type CapabilitiesResponse = {
  device_id: string
  gen2_enabled?: boolean
  relay_test_output_pin?: number
  control_authority?: string
  supabase_command_control?: boolean
  i2c?: {
    sda_pin?: number
    scl_pin?: number
  }
  i2c_scan?: {
    addresses_found?: string[]
  }
  legacy_dht11_enabled?: boolean
  modules: CapabilityModule[]
}

export type MeasurementRecord = {
  device_id: string
  measured_at: string
  sensor_key: string
  sensor_type: string
  measurement_name: string
  measurement_value: number | null
  measurement_unit: string
  valid: boolean
  quality: string
  reason: string
  control_eligible: boolean
  details: Record<string, unknown>
}

export type MeasurementsResponse = {
  device_id: string
  measured_at: string
  records: MeasurementRecord[]
}
