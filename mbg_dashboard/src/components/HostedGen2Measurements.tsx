import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import {
  compareHostedGen2MeasurementNames,
  formatHostedGen2MeasurementLabel,
  getHostedGen2MeasurementDisplay,
  getHostedGen2MeasurementStatus,
} from '../hostedGen2Display'
import {
  getHostedGen2TrendSummary,
  type HostedGen2TrendDirection,
  type HostedGen2SparklinePoint,
} from '../hostedGen2TrendSummary'
import { getHostedMeasurementTrust } from '../hostedMeasurementTrust'
import './HostedGen2Measurements.css'

type HostedGen2MeasurementsProps = {
  rows: HostedGen2MeasurementRow[]
  isLoading: boolean
  error: string | null
  fallbackDeviceLabel: string
}

const HostedGen2Measurements = ({
  rows,
  isLoading,
  error,
}: HostedGen2MeasurementsProps) => {
  const sortedRows = [...rows].sort(compareRowsNewestFirst)
  const hasUsableRows = rows.length > 0
  const isBlockingLoad = isLoading && !hasUsableRows
  const isRefreshing = isLoading && hasUsableRows
  const latestRows = getLatestSampleRows(sortedRows)
  const latestMeasurementRows = [...latestRows].sort(compareRowsForDisplay)
  const latestMeasuredAt = latestRows[0]?.measured_at ?? null

  return (
    <section className="hosted-gen2-measurements" aria-label="Live Measurements">
      <div className="hosted-gen2-measurements-header">
        <div>
          <h2>Live Measurements</h2>
          <p className="hosted-gen2-measurements-updated">
            Last Reading {formatTimestamp(latestMeasuredAt)}
          </p>
        </div>
        <span className="hosted-gen2-measurements-refresh">
          {isRefreshing ? 'Refreshing' : 'Live'}
        </span>
      </div>

      {error ? <p className="hosted-gen2-measurements-error">{error}</p> : null}

      {isBlockingLoad ? (
        <p className="hosted-gen2-measurements-note">Loading Gen2 measurements...</p>
      ) : null}

      {!isBlockingLoad && rows.length === 0 ? (
        <p className="hosted-gen2-measurements-note">
          No Gen2 measurements found for this device/window yet.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="hosted-gen2-measurements-card-grid">
            {latestMeasurementRows.map((row) => (
              <MeasurementCard
                key={getMeasurementCardKey(row)}
                label={formatHostedGen2MeasurementLabel(row.measurement_name)}
                row={row}
                rows={rows}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

const MeasurementCard = ({
  label,
  row,
  rows,
}: {
  label: string
  row: HostedGen2MeasurementRow | undefined
  rows: HostedGen2MeasurementRow[]
}) => {
  const display = getHostedGen2MeasurementDisplay(row?.measurement_name)
  const status = getHostedGen2MeasurementStatus({
    measurementName: row?.measurement_name,
    measurementValue: row?.measurement_value,
    valid: row?.valid,
  })
  const trust = getHostedMeasurementTrust({
    row,
    rows,
    fallbackStatus: status,
  })
  const trendSummary = getHostedGen2TrendSummary(row, rows)
  const shouldShowHeadlineReason = shouldShowTrustHeadlineReason(trust.headlineReason)

  return (
    <article
      className={[
        'hosted-gen2-measurements-card',
        `is-${trust.level}`,
        display.diagnostic ? 'is-diagnostic' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="hosted-gen2-measurements-card-main">
        <h3>{label}</h3>
        <span className="hosted-gen2-measurements-status-pill">{trust.label}</span>
      </div>
      <p className="hosted-gen2-measurements-value">{formatMeasurementValue(row)}</p>
      <div
        className={[
          'hosted-gen2-measurements-trend',
          `is-${trendSummary.direction.replace(/_/g, '-')}`,
        ].join(' ')}
      >
        <div className="hosted-gen2-measurements-trend-text">
          <span className="hosted-gen2-measurements-trend-label">
            Trend: <strong>{formatTrendLabel(trendSummary.direction, trendSummary.label)}</strong>
          </span>
          {trendSummary.deltaLabel ? (
            <span className="hosted-gen2-measurements-trend-delta">
              {trendSummary.deltaLabel}
            </span>
          ) : null}
        </div>
        {trendSummary.sparklinePoints ? (
          <TrendSparkline points={trendSummary.sparklinePoints} />
        ) : null}
      </div>
      {shouldShowHeadlineReason ? (
        <p className="hosted-gen2-measurements-status-reason">{trust.headlineReason}</p>
      ) : null}
      <details className="hosted-gen2-measurements-details">
        <summary>Sensor details</summary>
        <dl className="hosted-gen2-measurements-status">
          {!shouldShowHeadlineReason && trust.headlineReason ? (
            <>
              <dt>Status note</dt>
              <dd>{trust.headlineReason}</dd>
            </>
          ) : null}

          <dt>Display trust</dt>
          <dd>{trust.detailReason}</dd>

          <dt>Trust flags</dt>
          <dd>{formatTrustFlags(trust.trustFlags)}</dd>

          <dt>Sensor key</dt>
          <dd>{formatNullableText(row?.sensor_key)}</dd>

          <dt>Sensor type</dt>
          <dd>{formatNullableText(row?.sensor_type)}</dd>

          <dt>Valid</dt>
          <dd>{formatNullableBoolean(row?.valid)}</dd>

          <dt>Quality</dt>
          <dd>{formatNullableText(row?.quality)}</dd>

          <dt>Reason</dt>
          <dd>{formatNullableText(row?.reason)}</dd>

          <dt>Control eligible</dt>
          <dd>{formatControlEligible(row?.control_eligible)}</dd>
        </dl>
      </details>
    </article>
  )
}

const SPARKLINE_WIDTH = 64
const SPARKLINE_HEIGHT = 24
const SPARKLINE_PADDING = 3
const ROUTINE_TRUST_PASS_REASON = 'Reading is displayable and passed hosted trust checks.'

const TREND_DIRECTION_SYMBOLS: Partial<Record<HostedGen2TrendDirection, string>> = {
  rising: '↗',
  falling: '↘',
  stable: '→',
}

const TrendSparkline = ({ points }: { points: HostedGen2SparklinePoint[] }) => {
  const polylinePoints = formatSparklinePolyline(points)

  return (
    <svg
      className="hosted-gen2-measurements-sparkline"
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      aria-hidden="true"
      focusable="false"
    >
      <polyline points={polylinePoints} />
    </svg>
  )
}

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

const compareRowsForDisplay = (
  left: HostedGen2MeasurementRow,
  right: HostedGen2MeasurementRow,
) => {
  const measurementNameDiff = compareHostedGen2MeasurementNames(
    left.measurement_name,
    right.measurement_name,
  )

  if (measurementNameDiff !== 0) {
    return measurementNameDiff
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

const formatTrustFlags = (values: string[]): string =>
  values.length > 0 ? values.join(', ') : 'None'

const shouldShowTrustHeadlineReason = (value: string): boolean =>
  value !== ROUTINE_TRUST_PASS_REASON

const formatTrendLabel = (
  direction: HostedGen2TrendDirection,
  label: string,
): string => {
  const symbol = TREND_DIRECTION_SYMBOLS[direction]

  return symbol ? `${symbol} ${label}` : label
}

const formatSparklinePolyline = (points: HostedGen2SparklinePoint[]): string => {
  const innerWidth = SPARKLINE_WIDTH - SPARKLINE_PADDING * 2
  const innerHeight = SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2

  return points
    .map((point) => {
      const x = SPARKLINE_PADDING + point.x * innerWidth
      const y = SPARKLINE_PADDING + point.y * innerHeight

      return `${formatSvgNumber(x)},${formatSvgNumber(y)}`
    })
    .join(' ')
}

const formatSvgNumber = (value: number): string =>
  value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false,
  })

const getMeasurementCardKey = (row: HostedGen2MeasurementRow): string =>
  [
    row.measurement_name ?? 'measurement',
    row.sensor_key ?? 'sensor',
    row.sensor_type ?? 'type',
  ].join(':')

export default HostedGen2Measurements
