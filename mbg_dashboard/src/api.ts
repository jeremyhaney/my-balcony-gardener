import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { SensorData, SensorLogRow } from './types/sensorLog'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'
import { getConfiguredDeviceId } from './historyControls'

type HistoryFetchResult = {
  rows: SensorLogRow[]
  error: string | null
}

export type DeviceDiagnostics = {
  device_id: string
  device_key: string
  device_label: string
  device_role: string
  hosted_visible: boolean
  last_heartbeat_at: string | null
  heartbeat_age_seconds: number | null
  heartbeat_reason: string | null
  uptime_seconds: number | null
  wifi_connected: boolean | null
  wifi_rssi: number | null
  free_heap: number | null
  min_free_heap: number | null
  currently_watering: boolean | null
  last_watering_duration: number | null
}

type DeviceDiagnosticsFetchResult = {
  diagnostics: DeviceDiagnostics | null
  error: string | null
}

type SupabaseSensorLogRow = {
  id?: string | null
  device_id?: string | null
  timestamp?: string | null
  data?: Partial<SensorData> | null
}

const DEFAULT_HOSTED_GEN2_MEASUREMENT_LIMIT = 1000

const DEFAULT_SENSOR_DATA: SensorData = {
  temperature: 0,
  humidity: 0,
  moisture: 0,
  watering: false,
  lastWateredTime: 'Never',
  lastWateringDuration: 0,
}

const finiteNumberOrUndefined = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const mapSensorLogRow = (row: SupabaseSensorLogRow): SensorLogRow => ({
  id: row.id ?? undefined,
  device_id: row.device_id ?? '',
  timestamp: row.timestamp ?? new Date().toISOString(),
  data: {
    temperature: row.data?.temperature ?? DEFAULT_SENSOR_DATA.temperature,
    humidity: row.data?.humidity ?? DEFAULT_SENSOR_DATA.humidity,
    moisture: row.data?.moisture ?? DEFAULT_SENSOR_DATA.moisture,
    soilRawAdc: finiteNumberOrUndefined(row.data?.soilRawAdc),
    watering: row.data?.watering ?? DEFAULT_SENSOR_DATA.watering,
    lastWateredTime: row.data?.lastWateredTime ?? DEFAULT_SENSOR_DATA.lastWateredTime,
    lastWateringDuration:
      row.data?.lastWateringDuration ?? DEFAULT_SENSOR_DATA.lastWateringDuration,
  },
})

export async function fetchHistoryLogs(
  limit = 20,
  selectedDeviceId = '',
  timestampLowerBoundIso = '',
): Promise<HistoryFetchResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      rows: [],
      error: 'Supabase history is not configured.',
    }
  }

  try {
    const effectiveDeviceId = selectedDeviceId.trim() || getConfiguredDeviceId()
    let query = supabase
      .from('sensor_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (effectiveDeviceId) {
      query = query.eq('device_id', effectiveDeviceId)
    }

    if (timestampLowerBoundIso) {
      query = query.gte('timestamp', timestampLowerBoundIso)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const rows = ((data ?? []) as SupabaseSensorLogRow[]).map(mapSensorLogRow)

    return {
      rows,
      error: null,
    }
  } catch (error) {
    console.warn('Read-only history fetch failed:', error)

    return {
      rows: [],
      error: 'Supabase history is currently unavailable.',
    }
  }
}

export async function fetchDeviceDiagnostics(
  selectedDeviceId = '',
): Promise<DeviceDiagnosticsFetchResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      diagnostics: null,
      error: 'Supabase diagnostics are not configured.',
    }
  }

  try {
    const effectiveDeviceId = selectedDeviceId.trim() || getConfiguredDeviceId()

    if (!effectiveDeviceId) {
      return {
        diagnostics: null,
        error: null,
      }
    }

    const query = supabase
      .from('hosted_device_diagnostics')
      .select(
        'device_id, device_key, device_label, device_role, hosted_visible, last_heartbeat_at, heartbeat_age_seconds, heartbeat_reason, uptime_seconds, wifi_connected, wifi_rssi, free_heap, min_free_heap, currently_watering, last_watering_duration',
      )
      .eq('device_id', effectiveDeviceId)

    const { data, error } = await query.maybeSingle()

    if (error) {
      throw error
    }

    return {
      diagnostics: (data as DeviceDiagnostics | null) ?? null,
      error: null,
    }
  } catch (error) {
    console.warn('Read-only diagnostics fetch failed:', error)

    return {
      diagnostics: null,
      error: 'Supabase diagnostics are currently unavailable.',
    }
  }
}

export async function fetchHostedGen2Measurements(
  deviceId: string,
  options: {
    startTime?: string
    limit?: number
  } = {},
): Promise<HostedGen2MeasurementRow[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Gen2 measurements are not configured.')
  }

  const effectiveDeviceId = deviceId.trim() || getConfiguredDeviceId()
  const limit = Math.max(1, options.limit ?? DEFAULT_HOSTED_GEN2_MEASUREMENT_LIMIT)

  let query = supabase
    .from('hosted_gen2_measurements')
    .select(
      'device_id, device_key, device_label, device_role, measured_at, firmware_version, build_profile, record_index, sensor_key, sensor_type, measurement_name, measurement_value, measurement_unit, valid, quality, reason, control_eligible, batch_created_at',
    )
    .order('measured_at', { ascending: false })
    .order('record_index', { ascending: true })
    .limit(limit)

  if (effectiveDeviceId) {
    query = query.eq('device_id', effectiveDeviceId)
  }

  if (options.startTime) {
    query = query.gte('measured_at', options.startTime)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []) as HostedGen2MeasurementRow[]
}
