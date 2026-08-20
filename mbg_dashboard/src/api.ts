import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'
import {
  HOSTED_GEN2_MEASUREMENT_COLUMNS,
  markHostedGen2BatchIdentityUnavailable,
} from './hostedGen2MeasurementQueryContract'

export type HostedDataScope = 'demo' | 'customer' | 'support'

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
  firmware_version: string | null
  build_profile: string | null
  last_heartbeat_at: string | null
  heartbeat_age_seconds: number | null
  heartbeat_reason: string | null
  uptime_seconds: number | null
  wifi_connected: boolean | null
  wifi_rssi: number | null
  wifi_status_code: number | null
  wifi_status_label: string | null
  last_wifi_disconnect_reason: number | null
  last_wifi_disconnect_reason_label: string | null
  wifi_reconnect_attempts_since_boot: number | null
  wifi_full_recovery_attempts_since_boot: number | null
  wifi_disconnects_since_boot: number | null
  wifi_ip_acquisitions_since_boot: number | null
  last_wifi_disconnect_uptime_seconds: number | null
  last_wifi_ip_acquired_uptime_seconds: number | null
  last_wifi_activity: string | null
  last_http_status: number | null
  last_http_status_label: string | null
  consecutive_failures: number | null
  last_error_category: string | null
  last_successful_measurement_post_at: string | null
  last_successful_measurement_post_uptime_seconds: number | null
  last_successful_status_post_at: string | null
  last_successful_status_post_uptime_seconds: number | null
  currently_watering: boolean | null
  active_trigger_source: string | null
  last_watering_at: string | null
  last_watering_duration_seconds: number | null
  free_heap_bytes: number | null
  minimum_free_heap_bytes: number | null
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

const DEFAULT_HOSTED_GEN2_MEASUREMENT_LIMIT = 1000
const HOSTED_GEN2_MEASUREMENT_BATCH_SIZE = 1000
const DEVICE_DIAGNOSTICS_COLUMNS =
  'device_id, device_key, device_label, device_role, hosted_visible, firmware_version, build_profile, last_heartbeat_at, heartbeat_age_seconds, heartbeat_reason, uptime_seconds, wifi_connected, wifi_rssi, wifi_status_code, wifi_status_label, last_wifi_disconnect_reason, last_wifi_disconnect_reason_label, wifi_reconnect_attempts_since_boot, wifi_full_recovery_attempts_since_boot, wifi_disconnects_since_boot, wifi_ip_acquisitions_since_boot, last_wifi_disconnect_uptime_seconds, last_wifi_ip_acquired_uptime_seconds, last_wifi_activity, last_http_status, last_http_status_label, consecutive_failures, last_error_category, last_successful_measurement_post_at, last_successful_measurement_post_uptime_seconds, last_successful_status_post_at, last_successful_status_post_uptime_seconds, currently_watering, active_trigger_source, last_watering_at, last_watering_duration_seconds, free_heap_bytes, minimum_free_heap_bytes'
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
    const effectiveDeviceId = selectedDeviceId.trim()

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

  const effectiveDeviceId = deviceId.trim()
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

    const batchRows = markHostedGen2BatchIdentityUnavailable(
      (data ?? []) as unknown as Omit<HostedGen2MeasurementRow, 'batch_id'>[],
    )
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
    const effectiveDeviceId = deviceId.trim()

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
