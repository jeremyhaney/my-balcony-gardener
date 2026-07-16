import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { SensorData, SensorLogRow } from './types/sensorLog'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'
import { getConfiguredDeviceId } from './historyControls'

export type HostedDataScope = 'demo' | 'customer' | 'support'

type HistoryFetchResult = {
  rows: SensorLogRow[]
  error: string | null
}

export type GardenDevice = {
  garden_id: string
  garden_key: string
  garden_name: string
  location_label: string | null
  garden_sort_order: number
  garden_device_id: string
  device_id: string
  device_key: string
  display_name: string
  garden_device_role: string
  device_role: string
  device_sort_order: number
  customer_visible?: boolean
  support_visible?: boolean
}

type GardenDevicesFetchResult = {
  devices: GardenDevice[]
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
  wifi_reconnect_attempt_count: number | null
  last_supabase_http_status: number | null
  consecutive_supabase_failures: number | null
  last_supabase_error_category: string | null
  last_successful_telemetry_post_at: string | null
  last_successful_diagnostics_post_at: string | null
  free_heap: number | null
  min_free_heap: number | null
  currently_watering: boolean | null
  last_watering_duration: number | null
  pump_control_available: boolean | null
  device_can_water: boolean | null
  wifi_begin_recovery_attempt_count: number | null
  wifi_disconnect_event_count: number | null
  wifi_got_ip_event_count: number | null
  last_wifi_status_code: number | null
  last_wifi_disconnect_reason: number | null
  last_wifi_disconnected_uptime_seconds: number | null
  last_wifi_reconnected_uptime_seconds: number | null
  last_network_recovery_action: string | null
}

type DeviceDiagnosticsFetchResult = {
  diagnostics: DeviceDiagnostics | null
  error: string | null
}

export type HostedWateringEventRow = {
  id: string
  device_id: string
  device_key: string | null
  device_label: string | null
  event_at: string
  event_type:
    | 'watering_started'
    | 'watering_completed'
    | 'watering_blocked'
    | 'watering_safety_cutoff'
  trigger_source: 'manual_local' | 'automatic' | 'physical_button' | 'firmware_safety'
  duration_seconds: number | null
  reason: string | null
  firmware_version: string | null
  build_profile: string | null
  details: Record<string, unknown> | null
  created_at: string | null
}

type HostedWateringEventsFetchResult = {
  rows: HostedWateringEventRow[]
  error: string | null
}

type SupabaseSensorLogRow = {
  id?: string | null
  device_id?: string | null
  timestamp?: string | null
  data?: Partial<SensorData> | null
}

const DEFAULT_HOSTED_GEN2_MEASUREMENT_LIMIT = 1000
const HOSTED_GEN2_MEASUREMENT_BATCH_SIZE = 1000
const HOSTED_GEN2_MEASUREMENT_COLUMNS =
  'device_id, device_key, device_label, device_role, measured_at, firmware_version, build_profile, record_index, sensor_key, sensor_type, physical_sensor_id, measurement_name, measurement_value, measurement_unit, valid, quality, reason, batch_created_at'
const DEVICE_DIAGNOSTICS_COLUMNS =
  'device_id, device_key, device_label, device_role, hosted_visible, last_heartbeat_at, heartbeat_age_seconds, heartbeat_reason, uptime_seconds, wifi_connected, wifi_rssi, wifi_reconnect_attempt_count, last_supabase_http_status, consecutive_supabase_failures, last_supabase_error_category, last_successful_telemetry_post_at, last_successful_diagnostics_post_at, free_heap, min_free_heap, currently_watering, last_watering_duration, pump_control_available, device_can_water, wifi_begin_recovery_attempt_count, wifi_disconnect_event_count, wifi_got_ip_event_count, last_wifi_status_code, last_wifi_disconnect_reason, last_wifi_disconnected_uptime_seconds, last_wifi_reconnected_uptime_seconds, last_network_recovery_action'
const WATERING_EVENT_COLUMNS =
  'id, device_id, device_key, device_label, event_at, event_type, trigger_source, duration_seconds, reason, firmware_version, build_profile, details, created_at'

const getGardenDevicesView = (scope: HostedDataScope): string =>
  scope === 'support' ? 'support_garden_devices' : 'customer_garden_devices'

const getMeasurementsView = (scope: HostedDataScope): string => {
  if (scope === 'customer') {
    return 'customer_hosted_gen2_measurements'
  }

  if (scope === 'support') {
    return 'support_hosted_gen2_measurements'
  }

  return 'hosted_gen2_measurements'
}

const getDiagnosticsView = (scope: HostedDataScope): string => {
  if (scope === 'customer') {
    return 'customer_hosted_device_diagnostics'
  }

  if (scope === 'support') {
    return 'support_hosted_device_diagnostics'
  }

  return 'hosted_device_diagnostics'
}

const getWateringEventsView = (scope: Exclude<HostedDataScope, 'demo'>): string =>
  scope === 'support' ? 'support_watering_events' : 'customer_watering_events'

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
  scope: HostedDataScope = 'demo',
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
      .from(getDiagnosticsView(scope))
      .select(DEVICE_DIAGNOSTICS_COLUMNS)
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
    scope?: HostedDataScope
  } = {},
): Promise<HostedGen2MeasurementRow[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Gen2 measurements are not configured.')
  }

  const effectiveDeviceId = deviceId.trim() || getConfiguredDeviceId()
  const limit = Math.max(1, options.limit ?? DEFAULT_HOSTED_GEN2_MEASUREMENT_LIMIT)
  const rows: HostedGen2MeasurementRow[] = []

  while (rows.length < limit) {
    const batchStart = rows.length
    const batchEnd = Math.min(batchStart + HOSTED_GEN2_MEASUREMENT_BATCH_SIZE, limit) - 1

    let query = supabase
      .from(getMeasurementsView(options.scope ?? 'demo'))
      .select(HOSTED_GEN2_MEASUREMENT_COLUMNS)
      .order('measured_at', { ascending: false })
      .order('record_index', { ascending: true })
      .range(batchStart, batchEnd)

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

    const batchRows = (data ?? []) as HostedGen2MeasurementRow[]
    rows.push(...batchRows)

    if (batchRows.length < batchEnd - batchStart + 1) {
      break
    }
  }

  return rows
}

export async function fetchGardenDevices(
  scope: Exclude<HostedDataScope, 'demo'>,
): Promise<GardenDevicesFetchResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      devices: [],
      error: 'Supabase garden access is not configured.',
    }
  }

  try {
    const { data, error } = await supabase
      .from(getGardenDevicesView(scope))
      .select(
        [
          'garden_id',
          'garden_key',
          'garden_name',
          'location_label',
          'garden_sort_order',
          'garden_device_id',
          'device_id',
          'device_key',
          'display_name',
          'garden_device_role',
          'device_role',
          'device_sort_order',
          scope === 'support' ? 'customer_visible' : '',
          scope === 'support' ? 'support_visible' : '',
        ]
          .filter(Boolean)
          .join(', '),
      )
      .order('garden_sort_order', { ascending: true })
      .order('device_sort_order', { ascending: true })

    if (error) {
      throw error
    }

    return {
      devices: (data ?? []) as unknown as GardenDevice[],
      error: null,
    }
  } catch (error) {
    console.warn('Protected garden device fetch failed:', error)

    return {
      devices: [],
      error:
        scope === 'support'
          ? 'Support access is not available for this account.'
          : 'Garden access is currently unavailable.',
    }
  }
}

export async function fetchHostedWateringEvents(
  deviceId: string,
  options: {
    startTime?: string
    limit?: number
    scope: Exclude<HostedDataScope, 'demo'>
  },
): Promise<HostedWateringEventsFetchResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      rows: [],
      error: 'Supabase watering history is not configured.',
    }
  }

  try {
    const effectiveDeviceId = deviceId.trim() || getConfiguredDeviceId()

    if (!effectiveDeviceId) {
      return {
        rows: [],
        error: null,
      }
    }

    let query = supabase
      .from(getWateringEventsView(options.scope))
      .select(WATERING_EVENT_COLUMNS)
      .eq('device_id', effectiveDeviceId)
      .order('event_at', { ascending: false })
      .limit(Math.max(1, options.limit ?? 10))

    if (options.startTime) {
      query = query.gte('event_at', options.startTime)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return {
      rows: (data ?? []) as HostedWateringEventRow[],
      error: null,
    }
  } catch (error) {
    console.warn('Protected watering history fetch failed:', error)

    return {
      rows: [],
      error: 'Watering history is currently unavailable.',
    }
  }
}
