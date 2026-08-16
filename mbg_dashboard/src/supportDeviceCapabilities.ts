import { createDeviceCapabilitySessionCache } from './deviceCapabilities'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import type { SupportDeviceCapabilityRow } from './types/deviceCapabilities'

const SUPPORT_CAPABILITY_COLUMNS = [
  'device_id',
  'logical_sensor_key',
  'sensor_family',
  'logical_channel',
  'expected_measurement_names',
  'friendly_name',
  'location_label',
  'physical_sensor_id',
  'effective_from',
  'effective_to',
].join(', ')

const loadSupportDeviceCapabilityRows = async (
  deviceId: string,
): Promise<SupportDeviceCapabilityRow[]> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase device configuration is not configured.')
  }

  const { data, error } = await supabase
    .from('support_device_capabilities')
    .select(SUPPORT_CAPABILITY_COLUMNS)
    .eq('device_id', deviceId)
    .order('logical_sensor_key', { ascending: true })
    .order('effective_from', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as SupportDeviceCapabilityRow[]
}

export const fetchSupportDeviceCapabilities = createDeviceCapabilitySessionCache(
  loadSupportDeviceCapabilityRows,
)
