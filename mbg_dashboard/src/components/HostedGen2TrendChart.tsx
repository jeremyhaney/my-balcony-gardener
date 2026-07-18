import { type ReactNode, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  calculateGardenerMoistureIndex,
  DEFAULT_HOSTED_GEN2_CHART_GROUP,
  doesHostedGen2RowMatchCard,
  getHostedGen2ChartSeriesDescriptors,
  getHostedGen2ChartSeriesIdentity,
  HOSTED_GEN2_CARD_CATALOG,
  HOSTED_GEN2_CHART_GROUPS,
  normalizeHostedGen2ComparisonText,
  type HostedGen2ChartGroupKey,
  type HostedGen2ChartSeriesDescriptor,
} from '../hostedGen2Presentation'
import {
  formatWateringCycleMarkerLabel,
  type HostedWateringCycle,
} from '../hostedWateringCycles'
import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import './HostedGen2TrendChart.css'

type HostedGen2TrendChartProps = {
  rows: HostedGen2MeasurementRow[]
  isLoading: boolean
  error: string | null
  controls?: ReactNode
  className?: string
  wateringCycles?: HostedWateringCycle[]
}

type HostedGen2ChartPoint = {
  timestamp: string
  timestampMs: number
} & Record<string, number | string>

type HostedGen2ChartSeries = {
  descriptor: HostedGen2ChartSeriesDescriptor
  dataKey: string
  label: string
  unit: string
  color: string
  rows: HostedGen2MeasurementRow[]
}

type PreparedSeries = {
  descriptor: HostedGen2ChartSeriesDescriptor
  rows: HostedGen2MeasurementRow[]
}

type AxisDomainValue = number | ((value: number) => number)
type AxisDomain = [AxisDomainValue, AxisDomainValue]
type TimeDomain = [number, number]

const ACTIVE_FAMILY_AXIS_ID = 'active-family'
const MAX_WATERING_MARKER_COUNT = 6

const CHART_USABLE_QUALITY_VALUES = new Set([
  'good',
  'diagnostic',
  'ok',
  'okay',
])

const SERIES_COLORS: Record<HostedGen2ChartSeriesDescriptor['cardKey'], string> = {
  'light-l01': '#ca8a04',
  'light-l02': '#7c3aed',
  'light-l03': '#0f766e',
  'moisture-m01': '#0f766e',
  'moisture-m02': '#7c3aed',
  'moisture-m03': '#ca8a04',
  'air-temperature': '#ef4444',
  'soil-temperature': '#374151',
  humidity: '#0f766e',
  'atmospheric-pressure': '#7c3aed',
  'reservoir-water': '#64748b',
}

const withDefaultAxisDomain = (
  lowerBound: number,
  upperBound: number,
): AxisDomain => [
  (dataMin: number) => Math.min(lowerBound, Math.floor(dataMin)),
  (dataMax: number) => Math.max(upperBound, Math.ceil(dataMax)),
]

const HostedGen2TrendChart = ({
  rows,
  isLoading,
  error,
  controls,
  className = '',
  wateringCycles = [],
}: HostedGen2TrendChartProps) => {
  const [activeGroup, setActiveGroup] =
    useState<HostedGen2ChartGroupKey>(DEFAULT_HOSTED_GEN2_CHART_GROUP)

  // Frozen families always use the shared catalog and descriptor order.
  const activeDescriptors = useMemo(
    () => getHostedGen2ChartSeriesDescriptors(activeGroup),
    [activeGroup],
  )
  const chartSeries = useMemo(
    () => buildChartSeries(rows, activeDescriptors),
    [activeDescriptors, rows],
  )
  const chartData = useMemo(() => buildChartData(chartSeries), [chartSeries])
  const chartTimeDomain = useMemo(
    () => getChartTimeDomain(chartData, wateringCycles),
    [chartData, wateringCycles],
  )
  const visibleWateringMarkers = useMemo(
    () => getVisibleWateringMarkers(wateringCycles, chartTimeDomain),
    [chartTimeDomain, wateringCycles],
  )
  const activeUnit = chartSeries[0]?.unit ?? ''
  const activeGroupLabel =
    HOSTED_GEN2_CHART_GROUPS.find((group) => group.key === activeGroup)?.label ?? activeGroup
  const axisDomain = getAxisDomain(activeGroup, activeUnit)
  const hasRows = rows.length > 0
  const isBlockingLoad = isLoading && !hasRows

  return (
    <section
      className={['hosted-gen2-trend-chart', className].filter(Boolean).join(' ')}
      data-guide-target="chart"
      aria-label="Gen2 Trend Chart"
    >
      {controls ? <div className="hosted-gen2-trend-chart-header">{controls}</div> : null}

      {error ? <p className="hosted-gen2-trend-chart-error">{error}</p> : null}

      {isBlockingLoad ? (
        <p className="hosted-gen2-trend-chart-note">Loading Gen2 trend data...</p>
      ) : null}

      <div
        aria-label="Trend measurement family"
        className="hosted-gen2-trend-chart-toggles"
        role="group"
      >
        {HOSTED_GEN2_CHART_GROUPS.map((group) => (
          <button
            aria-pressed={activeGroup === group.key}
            className={[
              'hosted-gen2-trend-chart-toggle',
              activeGroup === group.key ? 'is-selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={group.key}
            onClick={() => setActiveGroup(group.key)}
            type="button"
          >
            {group.label}
          </button>
        ))}
      </div>

      {!isBlockingLoad && chartSeries.length === 0 ? (
        <p className="hosted-gen2-trend-chart-note">
          No usable {activeGroupLabel} readings are available for this device/window yet.
        </p>
      ) : null}

      {!isBlockingLoad && chartSeries.length > 0 ? (
        <div className="hosted-gen2-trend-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 12, left: 12, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestampMs"
                type="number"
                scale="time"
                domain={chartTimeDomain}
                tickFormatter={formatAxisTimestamp}
                minTickGap={28}
              />
              <YAxis
                yAxisId={ACTIVE_FAMILY_AXIS_ID}
                orientation="left"
                width={52}
                tickMargin={3}
                domain={axisDomain}
                axisLine={{ stroke: chartSeries[0].color }}
                tickLine={{ stroke: chartSeries[0].color }}
                tick={{ fill: chartSeries[0].color, fontSize: 12 }}
                label={{
                  value: activeUnit,
                  angle: -90,
                  position: 'insideLeft',
                  dx: -5,
                  fill: chartSeries[0].color,
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  const series = chartSeries.find((candidate) => candidate.label === String(name))
                  return [
                    formatTooltipValue(Number(value), activeGroup, series?.unit ?? activeUnit),
                    series?.label ?? String(name),
                  ]
                }}
                labelFormatter={(label) => formatTooltipTimestamp(Number(label))}
                labelStyle={{ color: '#111827', fontWeight: 700, marginBottom: '0.25rem' }}
              />
              <Legend />
              {visibleWateringMarkers.map((cycle) => (
                <ReferenceLine
                  key={cycle.id}
                  x={cycle.startTimestampMs}
                  yAxisId={ACTIVE_FAMILY_AXIS_ID}
                  stroke="#2563eb"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  ifOverflow="visible"
                  label={{
                    value: formatWateringCycleMarkerLabel(cycle),
                    position: 'insideTop',
                    fill: '#1d4ed8',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                />
              ))}
              {chartSeries.map((series) => (
                <Line
                  key={series.dataKey}
                  name={series.label}
                  yAxisId={ACTIVE_FAMILY_AXIS_ID}
                  type="monotone"
                  dataKey={series.dataKey}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={chartData.length < 24}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </section>
  )
}

const buildChartSeries = (
  rows: HostedGen2MeasurementRow[],
  descriptors: HostedGen2ChartSeriesDescriptor[],
): HostedGen2ChartSeries[] => {
  const preparedSeries: PreparedSeries[] = descriptors.flatMap((descriptor) => {
    const cardDescriptor = HOSTED_GEN2_CARD_CATALOG.find(
      (candidate) => candidate.key === descriptor.cardKey,
    )

    if (!cardDescriptor) {
      return []
    }

    // Chart history accepts only explicit usable evidence for the frozen card identity.
    const plottedRows = rows
      .filter((row) => doesHostedGen2RowMatchCard(row, cardDescriptor))
      .filter(isChartUsableRow)
      .map((row) => getPlottedRow(row, descriptor))

    return plottedRows.length > 0 ? [{ descriptor, rows: plottedRows }] : []
  })

  const firstPreparedSeries = preparedSeries[0]

  if (!firstPreparedSeries) {
    return []
  }

  const activeUnit = getNewestRow(firstPreparedSeries.rows)?.measurement_unit ?? ''
  const normalizedActiveUnit = normalizeHostedGen2ComparisonText(activeUnit)

  return preparedSeries.flatMap(({ descriptor, rows: candidateRows }) => {
    const compatibleCandidateRows = candidateRows.filter(
      (row) => normalizeHostedGen2ComparisonText(row.measurement_unit) === normalizedActiveUnit,
    )
    const identityRow = getNewestRow(compatibleCandidateRows)

    if (!identityRow) {
      return []
    }

    const compoundIdentity = getHostedGen2ChartSeriesIdentity(identityRow)
    const compatibleRows = compatibleCandidateRows.filter(
      (row) => getHostedGen2ChartSeriesIdentity(row) === compoundIdentity,
    )
    const rows = resolveDuplicateSeriesRows(compatibleRows)
    const representativeRow = getNewestRow(rows)

    if (!representativeRow) {
      return []
    }

    // Compound identity keeps same-name physical sensors in separate Recharts data keys.
    const dataKey = `series:${getHostedGen2ChartSeriesIdentity(representativeRow)}`

    return [{
      descriptor,
      dataKey,
      label: descriptor.label,
      unit: representativeRow.measurement_unit?.trim() ?? '',
      color: SERIES_COLORS[descriptor.cardKey],
      rows,
    }]
  })
}

const isChartUsableRow = (
  row: HostedGen2MeasurementRow,
): row is HostedGen2MeasurementRow & { measurement_value: number } => {
  const quality = normalizeHostedGen2ComparisonText(row.quality)
  const reason = normalizeHostedGen2ComparisonText(row.reason)

  return (
    typeof row.measurement_value === 'number' &&
    Number.isFinite(row.measurement_value) &&
    Number.isFinite(new Date(row.measured_at).getTime()) &&
    row.valid === true &&
    CHART_USABLE_QUALITY_VALUES.has(quality) &&
    !reason.includes('not_detected') &&
    !isStrictProfileNotInstalledRow(row)
  )
}

const isStrictProfileNotInstalledRow = (row: HostedGen2MeasurementRow): boolean => {
  const quality = normalizeHostedGen2ComparisonText(row.quality)

  return (
    (quality === 'not_installed' || quality === 'not installed') &&
    normalizeHostedGen2ComparisonText(row.reason) === 'profile_not_installed' &&
    row.valid === false &&
    row.measurement_value === null
  )
}

const getPlottedRow = (
  row: HostedGen2MeasurementRow & { measurement_value: number },
  descriptor: HostedGen2ChartSeriesDescriptor,
): HostedGen2MeasurementRow => {
  if (descriptor.derivedValue !== 'relative-moisture-index') {
    return row
  }

  // All three moisture sensors use the shared, unclamped Relative Moisture Index formula.
  return {
    ...row,
    measurement_name: 'moisture_index',
    measurement_unit: 'index',
    measurement_value: calculateGardenerMoistureIndex(row.measurement_value),
  }
}

const resolveDuplicateSeriesRows = (
  rows: HostedGen2MeasurementRow[],
): HostedGen2MeasurementRow[] => {
  const rowsByTimestamp = new Map<number, HostedGen2MeasurementRow>()

  // Duplicate samples use package provenance and a lexical final tie-breaker, never array order.
  rows.forEach((row) => {
    const timestampMs = new Date(row.measured_at).getTime()
    const currentRow = rowsByTimestamp.get(timestampMs)

    if (!currentRow || compareDuplicateRows(row, currentRow) > 0) {
      rowsByTimestamp.set(timestampMs, row)
    }
  })

  return Array.from(rowsByTimestamp.values()).sort(
    (left, right) => new Date(left.measured_at).getTime() - new Date(right.measured_at).getTime(),
  )
}

const compareDuplicateRows = (
  left: HostedGen2MeasurementRow,
  right: HostedGen2MeasurementRow,
): number => {
  const leftBatchTimestamp = getParseableTimestamp(left.batch_created_at)
  const rightBatchTimestamp = getParseableTimestamp(right.batch_created_at)

  if (leftBatchTimestamp !== rightBatchTimestamp) {
    return leftBatchTimestamp - rightBatchTimestamp
  }

  const leftRecordIndex = Number.isFinite(left.record_index)
    ? left.record_index
    : Number.NEGATIVE_INFINITY
  const rightRecordIndex = Number.isFinite(right.record_index)
    ? right.record_index
    : Number.NEGATIVE_INFINITY

  if (leftRecordIndex !== rightRecordIndex) {
    return leftRecordIndex - rightRecordIndex
  }

  return getRowFingerprint(left).localeCompare(getRowFingerprint(right))
}

const getParseableTimestamp = (value: string | null): number => {
  const timestamp = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY
}

const getRowFingerprint = (row: HostedGen2MeasurementRow): string =>
  JSON.stringify([
    row.device_id,
    row.physical_sensor_id,
    row.sensor_key,
    row.sensor_type,
    row.measurement_name,
    row.measurement_unit,
    row.measurement_value,
    row.valid,
    row.quality,
    row.reason,
    row.batch_created_at,
    row.record_index,
  ])

const getNewestRow = (
  rows: HostedGen2MeasurementRow[],
): HostedGen2MeasurementRow | undefined =>
  rows.reduce<HostedGen2MeasurementRow | undefined>((newestRow, row) => {
    if (!newestRow) {
      return row
    }

    const rowTimestamp = new Date(row.measured_at).getTime()
    const newestTimestamp = new Date(newestRow.measured_at).getTime()

    if (rowTimestamp !== newestTimestamp) {
      return rowTimestamp > newestTimestamp ? row : newestRow
    }

    return compareDuplicateRows(row, newestRow) > 0 ? row : newestRow
  }, undefined)

const buildChartData = (series: HostedGen2ChartSeries[]): HostedGen2ChartPoint[] => {
  const points = new Map<number, HostedGen2ChartPoint>()

  // Numeric timestamp aggregation merges equivalent instants without merging physical series.
  series.forEach((chartSeries) => {
    chartSeries.rows.forEach((row) => {
      const timestampMs = new Date(row.measured_at).getTime()
      const point = points.get(timestampMs) ?? {
        timestamp: new Date(timestampMs).toISOString(),
        timestampMs,
      }

      point[chartSeries.dataKey] = row.measurement_value ?? Number.NaN
      points.set(timestampMs, point)
    })
  })

  return Array.from(points.values()).sort((left, right) => left.timestampMs - right.timestampMs)
}

// One active compatible family uses one left-side axis and its actual unit.
const getAxisDomain = (
  group: HostedGen2ChartGroupKey,
  unit: string,
): AxisDomain | undefined => {
  const normalizedUnit = normalizeHostedGen2ComparisonText(unit)

  switch (group) {
    case 'moisture':
      return withDefaultAxisDomain(0, 100)
    case 'temperature':
      return isFahrenheitUnit(normalizedUnit) ? withDefaultAxisDomain(20, 100) : undefined
    case 'humidity':
      return isPercentUnit(normalizedUnit) ? [0, 100] : undefined
    case 'pressure':
      return normalizedUnit === 'hpa' ? withDefaultAxisDomain(950, 1050) : undefined
    case 'light':
      return undefined
  }
}

const isFahrenheitUnit = (unit: string): boolean =>
  ['f', '°f', 'deg f', 'fahrenheit'].includes(unit)

const isPercentUnit = (unit: string): boolean =>
  ['%', 'percent', 'percentage', 'pct'].includes(unit)

const getChartTimeDomain = (
  chartData: HostedGen2ChartPoint[],
  wateringCycles: HostedWateringCycle[],
): TimeDomain => {
  const timestamps = chartData.map((point) => point.timestampMs)

  wateringCycles.slice(0, MAX_WATERING_MARKER_COUNT).forEach((cycle) => {
    if (Number.isFinite(cycle.startTimestampMs)) {
      timestamps.push(cycle.startTimestampMs)
    }
  })

  if (timestamps.length === 0) {
    const now = Date.now()
    return [now - 60 * 60 * 1000, now]
  }

  const minTimestamp = Math.min(...timestamps)
  const maxTimestamp = Math.max(...timestamps)

  if (minTimestamp === maxTimestamp) {
    return [minTimestamp - 30 * 60 * 1000, maxTimestamp + 30 * 60 * 1000]
  }

  return [minTimestamp, maxTimestamp]
}

const getVisibleWateringMarkers = (
  wateringCycles: HostedWateringCycle[],
  chartTimeDomain: TimeDomain,
): HostedWateringCycle[] =>
  wateringCycles
    .filter(
      (cycle) =>
        cycle.startTimestampMs >= chartTimeDomain[0] &&
        cycle.startTimestampMs <= chartTimeDomain[1],
    )
    .slice(0, MAX_WATERING_MARKER_COUNT)

const formatAxisTimestamp = (timestampMs: number): string =>
  new Date(timestampMs).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  })

const formatTooltipTimestamp = (timestampMs: number): string =>
  new Date(timestampMs).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatTooltipValue = (
  value: number,
  group: HostedGen2ChartGroupKey,
  unit: string,
): string => {
  if (!Number.isFinite(value)) {
    return 'Not available'
  }

  const maximumFractionDigits = group === 'moisture' ? 1 : 2
  const formattedValue = value.toLocaleString([], { maximumFractionDigits })

  return unit ? `${formattedValue} ${unit}` : formattedValue
}

export default HostedGen2TrendChart
