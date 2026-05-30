import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import './HostedGen2Measurements.css'

type HostedGen2MeasurementsProps = {
  rows: HostedGen2MeasurementRow[]
  isLoading: boolean
  error: string | null
  fallbackDeviceLabel: string
}

type MeasurementName =
  | 'air_temperature'
  | 'relative_humidity'
  | 'moisture_index'
  | 'raw_adc'

const PRIMARY_MEASUREMENTS: Array<{
  name: MeasurementName
  label: string
}> = [
  { name: 'air_temperature', label: 'Air Temperature' },
  { name: 'relative_humidity', label: 'Relative Humidity' },
  { name: 'moisture_index', label: 'Moisture Index' },
]

const RECENT_TABLE_MEASUREMENTS: Array<{
  name: MeasurementName
  label: string
}> = [
  ...PRIMARY_MEASUREMENTS,
  { name: 'raw_adc', label: 'Raw ADC' },
]

const RECENT_SAMPLE_LIMIT = 8

const HostedGen2Measurements = ({
  rows,
  isLoading,
  error,
  fallbackDeviceLabel,
}: HostedGen2MeasurementsProps) => {
  const sortedRows = [...rows].sort(compareRowsNewestFirst)
  const latestRows = getLatestSampleRows(sortedRows)
  const rawAdcRecord = findMeasurement(latestRows, 'raw_adc')
  const deviceLabel = getLatestTextValue(sortedRows, 'device_label') ?? fallbackDeviceLabel
  const latestMeasuredAt = latestRows[0]?.measured_at ?? null
  const recentSamples = groupRowsBySampleTime(sortedRows).slice(0, RECENT_SAMPLE_LIMIT)

  return (
    <section className="hosted-gen2-measurements" aria-label="Gen2 Measurements">
      <div className="hosted-gen2-measurements-header">
        <div>
          <h2>Gen2 Measurements</h2>
          <p>{deviceLabel}</p>
          <p className="hosted-gen2-measurements-updated">
            Latest batch {formatTimestamp(latestMeasuredAt)}
          </p>
        </div>
        <span className="hosted-gen2-measurements-badge">Hosted read-only</span>
      </div>

      {error ? <p className="hosted-gen2-measurements-error">{error}</p> : null}

      {isLoading ? <p className="hosted-gen2-measurements-note">Loading Gen2 measurements...</p> : null}

      {!isLoading && rows.length === 0 ? (
        <p className="hosted-gen2-measurements-note">
          No Gen2 measurements found for this device/window yet.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="hosted-gen2-measurements-card-grid">
            {PRIMARY_MEASUREMENTS.map((measurement) => (
              <MeasurementCard
                key={measurement.name}
                label={measurement.label}
                row={findMeasurement(latestRows, measurement.name)}
              />
            ))}
          </div>

          <div className="hosted-gen2-measurements-raw">
            <div>
              <h3>Raw ADC</h3>
              <p className="hosted-gen2-measurements-value">
                {rawAdcRecord ? formatMeasurementValue(rawAdcRecord) : 'Not available'}
              </p>
            </div>
            <p className="hosted-gen2-measurements-meta">
              Diagnostic evidence only. Raw ADC is not mixed into the percent-based display.
              Control eligibility is local firmware evidence only, not hosted control authority.
            </p>
          </div>

          <div className="hosted-gen2-measurements-table-wrap">
            <table className="hosted-gen2-measurements-table">
              <caption>Recent Gen2 samples</caption>
              <thead>
                <tr>
                  <th scope="col">Sample time</th>
                  {RECENT_TABLE_MEASUREMENTS.map((measurement) => (
                    <th key={measurement.name} scope="col">
                      {measurement.label}
                    </th>
                  ))}
                  <th scope="col">Firmware</th>
                </tr>
              </thead>
              <tbody>
                {recentSamples.map((sample) => (
                  <tr key={sample.measuredAt}>
                    <th scope="row">{formatTimestamp(sample.measuredAt)}</th>
                    {RECENT_TABLE_MEASUREMENTS.map((measurement) => (
                      <td key={measurement.name}>
                        {formatMeasurementValue(findMeasurement(sample.rows, measurement.name))}
                      </td>
                    ))}
                    <td>{formatFirmware(sample.rows)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  )
}

const MeasurementCard = ({
  label,
  row,
}: {
  label: string
  row: HostedGen2MeasurementRow | undefined
}) => (
  <article className="hosted-gen2-measurements-card">
    <h3>{label}</h3>
    <p className="hosted-gen2-measurements-value">{formatMeasurementValue(row)}</p>
    <dl className="hosted-gen2-measurements-status">
      <dt>Valid</dt>
      <dd>{formatNullableBoolean(row?.valid)}</dd>

      <dt>Quality</dt>
      <dd>{formatNullableText(row?.quality)}</dd>

      <dt>Reason</dt>
      <dd>{formatNullableText(row?.reason)}</dd>

      <dt>Control eligible</dt>
      <dd>{formatControlEligible(row?.control_eligible)}</dd>
    </dl>
  </article>
)

const compareRowsNewestFirst = (
  left: HostedGen2MeasurementRow,
  right: HostedGen2MeasurementRow,
) => {
  const measuredAtDiff =
    getTimestampMs(right.measured_at) - getTimestampMs(left.measured_at)

  if (measuredAtDiff !== 0) {
    return measuredAtDiff
  }

  return left.record_index - right.record_index
}

const getLatestSampleRows = (sortedRows: HostedGen2MeasurementRow[]) => {
  const latestMeasuredAt = sortedRows[0]?.measured_at

  if (!latestMeasuredAt) {
    return []
  }

  return sortedRows.filter((row) => row.measured_at === latestMeasuredAt)
}

const groupRowsBySampleTime = (sortedRows: HostedGen2MeasurementRow[]) => {
  const groups = new Map<string, HostedGen2MeasurementRow[]>()

  sortedRows.forEach((row) => {
    groups.set(row.measured_at, [...(groups.get(row.measured_at) ?? []), row])
  })

  return Array.from(groups.entries()).map(([measuredAt, sampleRows]) => ({
    measuredAt,
    rows: sampleRows,
  }))
}

const findMeasurement = (
  rows: HostedGen2MeasurementRow[],
  measurementName: MeasurementName,
) => rows.find((row) => row.measurement_name === measurementName)

const getLatestTextValue = (
  rows: HostedGen2MeasurementRow[],
  key: keyof Pick<HostedGen2MeasurementRow, 'device_label'>,
) => rows.find((row) => row[key]?.trim())?.[key] ?? null

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available'
  }

  const parsedValue = new Date(value)

  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : value
}

const getTimestampMs = (value: string): number => {
  const timestampMs = new Date(value).getTime()
  return Number.isFinite(timestampMs) ? timestampMs : 0
}

const formatMeasurementValue = (
  row: HostedGen2MeasurementRow | undefined,
): string => {
  if (!row || row.measurement_value === null || !Number.isFinite(row.measurement_value)) {
    return 'Not available'
  }

  return `${row.measurement_value.toLocaleString()} ${row.measurement_unit ?? ''}`.trim()
}

const formatNullableBoolean = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  return value ? 'Yes' : 'No'
}

const formatNullableText = (value: string | null | undefined): string =>
  value?.trim() ? value : 'Not available'

const formatControlEligible = (value: boolean | null | undefined): string =>
  `${formatNullableBoolean(value)} - local firmware evidence only`

const formatFirmware = (rows: HostedGen2MeasurementRow[]): string => {
  const row = rows.find((sampleRow) => sampleRow.firmware_version || sampleRow.build_profile)

  if (!row) {
    return 'Not available'
  }

  return [row.firmware_version, row.build_profile].filter(Boolean).join(' / ')
}

export default HostedGen2Measurements
