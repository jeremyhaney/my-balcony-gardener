import type {
  CommissionedDeviceCapability,
  SupportDeviceCapabilityRow,
} from './types/deviceCapabilities'

export const normalizeSupportDeviceCapability = (
  row: SupportDeviceCapabilityRow,
): CommissionedDeviceCapability => ({
  deviceId: row.device_id.trim(),
  logicalSensorKey: row.logical_sensor_key.trim().toLowerCase(),
  sensorFamily: row.sensor_family.trim().toLowerCase(),
  logicalChannel: row.logical_channel.trim().toUpperCase(),
  expectedMeasurementNames: row.expected_measurement_names.map((name) => name.trim().toLowerCase()),
  friendlyName: normalizeOptionalText(row.friendly_name),
  locationLabel: normalizeOptionalText(row.location_label),
  physicalSensorId: normalizeOptionalText(row.physical_sensor_id),
  effectiveFrom: row.effective_from,
  effectiveTo: row.effective_to,
})

export const isCapabilityEffectiveAt = (
  capability: CommissionedDeviceCapability,
  now: Date,
): boolean => {
  const nowMs = now.getTime()
  const fromMs = new Date(capability.effectiveFrom).getTime()
  const toMs = capability.effectiveTo ? new Date(capability.effectiveTo).getTime() : null

  return Number.isFinite(fromMs) && fromMs <= nowMs &&
    (toMs === null || (Number.isFinite(toMs) && toMs > nowMs))
}

export const getCurrentDeviceCapabilities = (
  rows: readonly SupportDeviceCapabilityRow[],
  now = new Date(),
): CommissionedDeviceCapability[] => rows
  .map(normalizeSupportDeviceCapability)
  .filter((capability) => isCapabilityEffectiveAt(capability, now))

export type CapabilityLoader = (deviceId: string) => Promise<SupportDeviceCapabilityRow[]>

export type CapabilityConfigurationState =
  | { kind: 'loading'; message: 'Loading device configuration...' }
  | { kind: 'failure'; message: 'Unable to load device configuration.' }
  | { kind: 'empty'; message: 'No commissioned sensors are configured for this device.' }
  | { kind: 'ready'; message: null }

export const getCapabilityConfigurationState = (
  isLoading: boolean,
  error: string | null,
  capabilityCount: number,
): CapabilityConfigurationState => {
  if (isLoading) return { kind: 'loading', message: 'Loading device configuration...' }
  if (error) return { kind: 'failure', message: 'Unable to load device configuration.' }
  if (capabilityCount === 0) {
    return { kind: 'empty', message: 'No commissioned sensors are configured for this device.' }
  }
  return { kind: 'ready', message: null }
}

export const createDeviceCapabilitySessionCache = (loader: CapabilityLoader) => {
  const cache = new Map<string, Promise<CommissionedDeviceCapability[]>>()

  return (deviceId: string): Promise<CommissionedDeviceCapability[]> => {
    const normalizedDeviceId = deviceId.trim()
    const cached = cache.get(normalizedDeviceId)
    if (cached) return cached

    const request = loader(normalizedDeviceId)
      .then((rows) => getCurrentDeviceCapabilities(rows))
      .catch((error: unknown) => {
        cache.delete(normalizedDeviceId)
        throw error
      })
    cache.set(normalizedDeviceId, request)
    return request
  }
}

const normalizeOptionalText = (value: string | null): string | null => {
  const normalized = value?.trim() ?? ''
  return normalized || null
}
