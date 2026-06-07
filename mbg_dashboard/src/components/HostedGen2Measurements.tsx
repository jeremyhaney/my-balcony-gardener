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
import {
  getHostedGen2MeasurementDisplayModels,
  type HostedGen2MeasurementDisplayModel,
} from '../hostedGen2RecentValue'
import './HostedGen2Measurements.css'

type HostedGen2MeasurementsProps = {
  rows: HostedGen2MeasurementRow[]
  isLoading: boolean
  error: string | null
  fallbackDeviceLabel: string
  className?: string
}

const HostedGen2Measurements = ({
  rows,
  isLoading,
  error,
  className = '',
}: HostedGen2MeasurementsProps) => {
  const sortedRows = [...rows].sort(compareRowsNewestFirst)
  const hasUsableRows = rows.length > 0
  const isBlockingLoad = isLoading && !hasUsableRows
  const isRefreshing = isLoading && hasUsableRows
  const measurementDisplayModels = getHostedGen2MeasurementDisplayModels(sortedRows)
    .sort(compareDisplayModelsForDisplay)
  const latestMeasuredAt = sortedRows[0]?.measured_at ?? null

  return (
    <section
      className={['hosted-gen2-measurements', className].filter(Boolean).join(' ')}
      data-guide-target="readings"
      aria-label="Live Measurements"
    >
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
            {measurementDisplayModels.map((model) => (
              <MeasurementCard
                key={getMeasurementCardKey(model.latestRow)}
                label={formatHostedGen2MeasurementLabel(model.latestRow.measurement_name)}
                model={model}
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
  model,
  rows,
}: {
  label: string
  model: HostedGen2MeasurementDisplayModel
  rows: HostedGen2MeasurementRow[]
}) => {
  const latestRow = model.latestRow
  const displayRow = model.displayRow ?? undefined
  const display = getHostedGen2MeasurementDisplay(latestRow.measurement_name)
  const status =
    model.mode === 'unavailable'
      ? { level: 'check' as const, label: 'Check Sensor', reason: 'Reading unavailable' }
      : getHostedGen2MeasurementStatus({
          measurementName: displayRow?.measurement_name,
          measurementValue: displayRow?.measurement_value,
          valid: displayRow?.valid,
        })
  const baseTrust = getHostedMeasurementTrust({
    row: displayRow,
    rows,
    fallbackStatus: status,
  })
  const trust =
    model.mode === 'recent-good'
      ? {
          level: 'watch' as const,
          label: model.labelOverride ?? 'Using Recent Value',
          headlineReason: model.message ?? '',
          detailReason: model.detailReason ?? '',
          trustFlags: model.trustFlags,
        }
      : model.mode === 'unavailable'
        ? {
            level: 'failed' as const,
            label: model.labelOverride ?? 'Check Sensor',
            headlineReason: model.message ?? '',
            detailReason: model.detailReason ?? '',
            trustFlags: model.trustFlags,
          }
        : baseTrust
  const trendSummary = getHostedGen2TrendSummary(displayRow, rows)
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
      <p className="hosted-gen2-measurements-value">{formatMeasurementValue(displayRow)}</p>
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

          <dt>Display source</dt>
          <dd>{formatDisplaySource(model.mode)}</dd>

          <dt>Displayed measured at</dt>
          <dd>{formatTimestamp(displayRow?.measured_at)}</dd>

          {model.recentGoodRow ? (
            <>
              <dt>Recent good evidence</dt>
              <dd>{formatRecentGoodEvidence(model.latestRow, model.recentGoodRow)}</dd>
            </>
          ) : null}

          <dt>Latest measured at</dt>
          <dd>{formatTimestamp(latestRow.measured_at)}</dd>

          <dt>Sensor key</dt>
          <dd>{formatNullableText(latestRow.sensor_key)}</dd>

          <dt>Sensor type</dt>
          <dd>{formatNullableText(latestRow.sensor_type)}</dd>

          <dt>Latest valid</dt>
          <dd>{formatNullableBoolean(latestRow.valid)}</dd>

          <dt>Latest quality</dt>
          <dd>{formatNullableText(latestRow.quality)}</dd>

          <dt>Latest reason</dt>
          <dd>{formatNullableText(latestRow.reason)}</dd>

          <dt>Latest control eligible</dt>
          <dd>{formatControlEligible(latestRow.control_eligible)}</dd>

          {model.mode === 'recent-good' ? (
            <>
              <dt>Displayed control eligible</dt>
              <dd>{formatControlEligible(displayRow?.control_eligible)}</dd>
            </>
          ) : null}
        </dl>
      </details>
    </article>
  )
}

const SPARKLINE_WIDTH = 64
const SPARKLINE_HEIGHT = 24
const SPARKLINE_PADDING = 3
const ROUTINE_TRUST_PASS_REASON = 'Reading is displayable and passed dashboard quality checks.'

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

const compareDisplayModelsForDisplay = (
  left: HostedGen2MeasurementDisplayModel,
  right: HostedGen2MeasurementDisplayModel,
) => compareRowsForDisplay(left.latestRow, right.latestRow)

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
  `${formatNullableBoolean(value)} - garden unit evidence only`

const formatTrustFlags = (values: string[]): string =>
  values.length > 0 ? values.join(', ') : 'None'

const formatDisplaySource = (mode: HostedGen2MeasurementDisplayModel['mode']): string => {
  if (mode === 'recent-good') {
    return 'Using recent good value; latest read evidence remains below.'
  }

  if (mode === 'unavailable') {
    return 'Latest read is not displayable and no recent good value was found.'
  }

  return 'Latest garden reading.'
}

const formatRecentGoodEvidence = (
  latestRow: HostedGen2MeasurementRow,
  recentGoodRow: HostedGen2MeasurementRow,
): string => {
  const value = formatMeasurementValue(recentGoodRow)
  const measuredAt = formatTimestamp(recentGoodRow.measured_at)
  const ageFromLatest = formatDurationBetween(recentGoodRow.measured_at, latestRow.measured_at)

  return `${value} at ${measuredAt}; ${ageFromLatest} before latest read.`
}

const formatDurationBetween = (startValue: string, endValue: string): string => {
  const startMs = new Date(startValue).getTime()
  const endMs = new Date(endValue).getTime()

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return 'age unavailable'
  }

  const totalSeconds = Math.round((endMs - startMs) / 1000)

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`
  }

  const totalMinutes = Math.round(totalSeconds / 60)

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const totalHours = Math.round(totalMinutes / 60)
  return `${totalHours} hr`
}

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
