import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

export const HOSTED_GEN2_MEASUREMENT_COLUMNS: string =
  'device_id, device_key, device_label, device_role, measured_at, firmware_version, build_profile, record_index, sensor_key, sensor_type, physical_sensor_id, measurement_name, measurement_value, measurement_unit, valid, quality, reason, batch_created_at'

export const markHostedGen2BatchIdentityUnavailable = (
  rows: readonly Omit<HostedGen2MeasurementRow, 'batch_id'>[],
): HostedGen2MeasurementRow[] => rows.map((row) => ({ ...row, batch_id: null }))
