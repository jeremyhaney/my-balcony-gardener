import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { SensorData, SensorLogRow } from './types/sensorLog'
import { getConfiguredDeviceId } from './historyControls'

type HistoryFetchResult = {
  rows: SensorLogRow[]
  error: string | null
}

type SupabaseSensorLogRow = {
  id?: string | null
  device_id?: string | null
  timestamp?: string | null
  data?: Partial<SensorData> | null
}

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

export async function fetchLogs() {
  const response = await fetch('http://10.0.0.200/logs')
  if (!response.ok) throw new Error('Failed to fetch logs')
  return response.json()
}

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
