import { type CSSProperties, type ReactNode, useMemo, useState } from 'react'
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
  doesHostedGen2RowMatchCard,
  getHostedGen2ChartSeriesDescriptors,
  getHostedGen2ChartSeriesIdentity,
  HOSTED_GEN2_CARD_CATALOG,
  HOSTED_GEN2_CHART_GROUPS,
  normalizeHostedGen2ComparisonText,
  type HostedGen2CardKey,
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
  axisId: HostedGen2AxisId
  rows: HostedGen2MeasurementRow[]
}

type PreparedSeries = {
  descriptor: HostedGen2ChartSeriesDescriptor
  rows: HostedGen2MeasurementRow[]
}

type AxisDomainValue = number | ((value: number) => number)
type AxisDomain = [AxisDomainValue, AxisDomainValue]
type TimeDomain = [number, number]

type HostedGen2AxisId = 'F' | '%' | 'index' | 'hPa' | 'lux'

type HostedGen2AxisConfig = {
  id: HostedGen2AxisId
  order: number
  fullLabel: string
  compactLabel: string
  color: string
  domain?: AxisDomain
}

type WateringLabelAnchor = 'start' | 'middle' | 'end'

type HostedGen2WateringMarkerPresentation = {
  cycle: HostedWateringCycle
  label: string
  lane: number
  anchor: WateringLabelAnchor
}

type WateringMarkerLabelProps = {
  label: string
  lane: number
  anchor: WateringLabelAnchor
  markerId: string
  viewBox?: {
    x?: number
    y?: number
  }
}

const MAX_WATERING_MARKER_COUNT = 6
const LEFT_AXIS_WIDTH = 52
const RIGHT_AXIS_WIDTH = 54
const MINIMUM_PLOT_WIDTH = 560
const BASE_CHART_TOP_MARGIN = 20
const WATERING_LABEL_LANE_HEIGHT = 15
const WATERING_LABEL_BASE_OFFSET = 8
const WATERING_LABEL_ESTIMATED_CHARACTER_WIDTH = 6.5
const WATERING_LABEL_HORIZONTAL_PADDING = 12
const WATERING_LABEL_MINIMUM_WIDTH = 54
const WATERING_LABEL_MINIMUM_GAP = 10
const WATERING_LABEL_EDGE_THRESHOLD = 0.14

const DEFAULT_SELECTED_CARD_KEYS: readonly HostedGen2CardKey[] = [
  'air-temperature',
  'humidity',
]

const CHART_USABLE_QUALITY_VALUES = new Set([
  'good',
  'diagnostic',
  'ok',
  'okay',
])

// Frozen series colors keep controls, lines, legends, and tooltips visually distinct.
const SERIES_COLORS: Record<HostedGen2ChartSeriesDescriptor['cardKey'], string> = {
  'light-l01': '#d97706',
  'light-l02': '#db2777',
  'light-l03': '#0891b2',
  'moisture-m01': '#16a34a',
  'moisture-m02': '#2563eb',
  'moisture-m03': '#7c3aed',
  'air-temperature': '#dc2626',
  'soil-temperature': '#78350f',
  humidity: '#0f766e',
  'atmospheric-pressure': '#a21caf',
  'reservoir-water': '#64748b',
}

const CHART_SERIES_DESCRIPTORS = getHostedGen2ChartSeriesDescriptors()

const withDefaultAxisDomain = (
  lowerBound: number,
  upperBound: number,
): AxisDomain => [
  (dataMin: number) => Math.min(lowerBound, Math.floor(dataMin)),
  (dataMax: number) => Math.max(upperBound, Math.ceil(dataMax)),
]

const AXIS_CONFIGS: Record<HostedGen2AxisId, HostedGen2AxisConfig> = {
  F: {
    id: 'F', order: 1, fullLabel: 'Temperature (F)', compactLabel: 'Temperature',
    color: '#ef4444', domain: withDefaultAxisDomain(20, 100),
  },
  '%': {
    id: '%', order: 2, fullLabel: 'Humidity (%)', compactLabel: 'Humidity',
    color: '#2563eb', domain: [0, 100],
  },
  index: {
    id: 'index', order: 3, fullLabel: 'Moisture Index', compactLabel: 'Moisture',
    color: '#16a34a', domain: withDefaultAxisDomain(0, 100),
  },
  hPa: {
    id: 'hPa', order: 4, fullLabel: 'Pressure (hPa)', compactLabel: 'Pressure',
    color: '#7c3aed', domain: withDefaultAxisDomain(950, 1050),
  },
  lux: {
    id: 'lux', order: 5, fullLabel: 'Light (lux)', compactLabel: 'Light',
    color: '#ca8a04',
  },
}

const HostedGen2TrendChart = ({
  rows,
  isLoading,
  error,
  controls,
  className = '',
  wateringCycles = [],
}: HostedGen2TrendChartProps) => {
  const [selectedCardKeys, setSelectedCardKeys] = useState<HostedGen2CardKey[]>(
    () => [...DEFAULT_SELECTED_CARD_KEYS],
  )
  const selectedCardKeySet = useMemo(() => new Set(selectedCardKeys), [selectedCardKeys])
  const chartSeries = useMemo(
    () => buildChartSeries(rows, CHART_SERIES_DESCRIPTORS),
    [rows],
  )
  const selectedSeries = useMemo(
    () => chartSeries.filter((series) => selectedCardKeySet.has(series.descriptor.cardKey)),
    [chartSeries, selectedCardKeySet],
  )
  const availableCardKeys = useMemo(
    () => new Set(chartSeries.map((series) => series.descriptor.cardKey)),
    [chartSeries],
  )
  const unavailableSelectedDescriptors = CHART_SERIES_DESCRIPTORS.filter(
    (descriptor) =>
      selectedCardKeySet.has(descriptor.cardKey) && !availableCardKeys.has(descriptor.cardKey),
  )
  const chartData = useMemo(() => buildChartData(selectedSeries), [selectedSeries])
  const chartTimeDomain = useMemo(
    () => getChartTimeDomain(chartData, wateringCycles),
    [chartData, wateringCycles],
  )
  const visibleWateringMarkers = useMemo(
    () => getVisibleWateringMarkers(wateringCycles, chartTimeDomain),
    [chartTimeDomain, wateringCycles],
  )
  const wateringMarkerPresentations = useMemo(
    () => prepareWateringMarkerPresentations(
      visibleWateringMarkers,
      chartTimeDomain,
      MINIMUM_PLOT_WIDTH,
    ),
    [chartTimeDomain, visibleWateringMarkers],
  )
  const wateringLabelLaneCount = wateringMarkerPresentations.length === 0
    ? 0
    : Math.max(...wateringMarkerPresentations.map((marker) => marker.lane)) + 1
  const chartTopMargin =
    BASE_CHART_TOP_MARGIN + wateringLabelLaneCount * WATERING_LABEL_LANE_HEIGHT
  const selectedAxes = getSelectedAxes(selectedSeries)
  const primaryAxisId = selectedAxes[0]?.id
  const rightAxisCount = Math.max(0, selectedAxes.length - 1)
  const minimumCanvasWidth =
    MINIMUM_PLOT_WIDTH + LEFT_AXIS_WIDTH + rightAxisCount * RIGHT_AXIS_WIDTH
  const hasRows = rows.length > 0
  const isBlockingLoad = isLoading && !hasRows

  const handleToggleSeries = (cardKey: HostedGen2CardKey) => {
    setSelectedCardKeys((currentKeys) =>
      currentKeys.includes(cardKey)
        ? currentKeys.filter((currentKey) => currentKey !== cardKey)
        : CHART_SERIES_DESCRIPTORS
            .filter(
              (descriptor) =>
                currentKeys.includes(descriptor.cardKey) || descriptor.cardKey === cardKey,
            )
            .map((descriptor) => descriptor.cardKey),
    )
  }

  const handleToggleFamily = (group: HostedGen2ChartGroupKey) => {
    const familyKeys = CHART_SERIES_DESCRIPTORS
      .filter((descriptor) => descriptor.group === group)
      .map((descriptor) => descriptor.cardKey)
    const allSelected = familyKeys.every((cardKey) => selectedCardKeySet.has(cardKey))

    setSelectedCardKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys)

      familyKeys.forEach((cardKey) => {
        if (allSelected) nextKeys.delete(cardKey)
        else nextKeys.add(cardKey)
      })

      return CHART_SERIES_DESCRIPTORS
        .filter((descriptor) => nextKeys.has(descriptor.cardKey))
        .map((descriptor) => descriptor.cardKey)
    })
  }

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

      <div className="hosted-gen2-trend-chart-family-shortcuts">
        <span className="hosted-gen2-trend-chart-control-label">Select families</span>
        <div aria-label="Trend measurement family shortcuts" role="group">
          {HOSTED_GEN2_CHART_GROUPS.map((group) => {
            const familyDescriptors = CHART_SERIES_DESCRIPTORS.filter(
              (descriptor) => descriptor.group === group.key,
            )
            const selectedCount = familyDescriptors.filter((descriptor) =>
              selectedCardKeySet.has(descriptor.cardKey),
            ).length
            const pressedState: boolean | 'mixed' =
              selectedCount === 0
                ? false
                : selectedCount === familyDescriptors.length
                  ? true
                  : 'mixed'

            return (
              <button
                aria-pressed={pressedState}
                className={[
                  'hosted-gen2-trend-chart-family-shortcut',
                  selectedCount > 0 ? 'is-selected' : '',
                ].filter(Boolean).join(' ')}
                key={group.key}
                onClick={() => handleToggleFamily(group.key)}
                type="button"
              >
                {group.label}
              </button>
            )
          })}
        </div>
      </div>

      <fieldset className="hosted-gen2-trend-chart-series-controls">
        <legend>Readings</legend>
        <div className="hosted-gen2-trend-chart-series-toggles">
          {CHART_SERIES_DESCRIPTORS.map((descriptor) => {
            const isSelected = selectedCardKeySet.has(descriptor.cardKey)

            return (
              <label
                className={[
                  'hosted-gen2-trend-chart-toggle',
                  isSelected ? 'is-selected' : '',
                ].filter(Boolean).join(' ')}
                key={descriptor.cardKey}
                style={{
                  '--hosted-gen2-series-color': SERIES_COLORS[descriptor.cardKey],
                } as CSSProperties}
              >
                <input
                  checked={isSelected}
                  onChange={() => handleToggleSeries(descriptor.cardKey)}
                  type="checkbox"
                />
                <span>{descriptor.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {selectedCardKeys.length > 0 && selectedSeries.length > 0 && unavailableSelectedDescriptors.length > 0 ? (
        <p className="hosted-gen2-trend-chart-series-status">
          Unavailable in this window: {unavailableSelectedDescriptors.map((descriptor) => descriptor.label).join(', ')}
        </p>
      ) : null}

      {!isBlockingLoad && selectedCardKeys.length === 0 ? (
        <p className="hosted-gen2-trend-chart-note">
          Select one or more readings to chart.
        </p>
      ) : null}

      {!isBlockingLoad && selectedCardKeys.length > 0 && selectedSeries.length === 0 ? (
        <p className="hosted-gen2-trend-chart-note">
          Selected readings are unavailable in this window.
        </p>
      ) : null}

      {!isBlockingLoad && selectedSeries.length > 0 ? (
        <div className="hosted-gen2-trend-chart-frame">
          <div className="hosted-gen2-trend-chart-frame-scroll">
            <div
              className="hosted-gen2-trend-chart-canvas"
              style={{ minWidth: `${minimumCanvasWidth}px` }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: chartTopMargin, right: 12, left: 12, bottom: 5 }}
                >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestampMs"
                type="number"
                scale="time"
                domain={chartTimeDomain}
                tickFormatter={formatAxisTimestamp}
                minTickGap={28}
              />
              {selectedAxes.map((axis, index) => {
                const isLeftAxis = index === 0
                const isOutermostRightAxis = index === selectedAxes.length - 1

                return (
                  <YAxis
                    axisLine={{ stroke: axis.color }}
                    domain={axis.domain}
                    key={axis.id}
                    label={{
                      value: isLeftAxis ? axis.fullLabel : axis.compactLabel,
                      angle: isLeftAxis ? -90 : 90,
                      position: isLeftAxis ? 'insideLeft' : 'insideRight',
                      dx: isLeftAxis ? -5 : isOutermostRightAxis ? 4 : -10,
                      fill: axis.color,
                      style: { textAnchor: 'middle' },
                    }}
                    orientation={isLeftAxis ? 'left' : 'right'}
                    tick={{ fill: axis.color, fontSize: 12 }}
                    tickLine={{ stroke: axis.color }}
                    tickMargin={3}
                    width={isLeftAxis ? LEFT_AXIS_WIDTH : RIGHT_AXIS_WIDTH}
                    yAxisId={axis.id}
                  />
                )
              })}
              <Tooltip
                formatter={(value, _name, item) => {
                  const series = selectedSeries.find(
                    (candidate) => candidate.dataKey === String(item.dataKey),
                  )
                  return [
                    formatTooltipValue(Number(value), series),
                    series?.label ?? String(item.name),
                  ]
                }}
                labelFormatter={(label) => formatTooltipTimestamp(Number(label))}
                labelStyle={{ color: '#111827', fontWeight: 700, marginBottom: '0.25rem' }}
              />
              <Legend />
              {primaryAxisId ? wateringMarkerPresentations.map(({
                cycle,
                label,
                lane,
                anchor,
              }) => (
                <ReferenceLine
                  key={cycle.id}
                  x={cycle.startTimestampMs}
                  yAxisId={primaryAxisId}
                  stroke="#2563eb"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  ifOverflow="visible"
                  label={
                    <WateringMarkerLabel
                      anchor={anchor}
                      label={label}
                      lane={lane}
                      markerId={cycle.id}
                    />
                  }
                />
              )) : null}
              {selectedSeries.map((series) => (
                <Line
                  key={series.dataKey}
                  name={series.label}
                  yAxisId={series.axisId}
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
          </div>
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

  return preparedSeries.flatMap(({ descriptor, rows: candidateRows }) => {
    const identityRow = getNewestRow(candidateRows)

    if (!identityRow) {
      return []
    }

    const compoundIdentity = getHostedGen2ChartSeriesIdentity(identityRow)
    const compatibleRows = candidateRows.filter(
      (row) => getHostedGen2ChartSeriesIdentity(row) === compoundIdentity,
    )
    const rows = resolveDuplicateSeriesRows(compatibleRows)
    const representativeRow = getNewestRow(rows)

    if (!representativeRow) {
      return []
    }

    // Compound identity keeps same-name physical sensors in separate Recharts data keys.
    const dataKey = `series:${getHostedGen2ChartSeriesIdentity(representativeRow)}`
    const unit = representativeRow.measurement_unit?.trim() ?? ''
    const axisId = getAxisIdForUnit(unit)

    if (!axisId) {
      return []
    }

    return [{
      descriptor,
      dataKey,
      label: descriptor.label,
      unit,
      color: SERIES_COLORS[descriptor.cardKey],
      axisId,
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

const getAxisIdForUnit = (unit: string): HostedGen2AxisId | null => {
  switch (normalizeHostedGen2ComparisonText(unit)) {
    case 'f':
      return 'F'
    case '%':
      return '%'
    case 'index':
      return 'index'
    case 'hpa':
      return 'hPa'
    case 'lux':
      return 'lux'
    default:
      return null
  }
}

const getSelectedAxes = (
  series: HostedGen2ChartSeries[],
): HostedGen2AxisConfig[] => {
  const selectedAxisIds = new Set(series.map((chartSeries) => chartSeries.axisId))

  return Object.values(AXIS_CONFIGS)
    .filter((axis) => selectedAxisIds.has(axis.id))
    .sort((left, right) => left.order - right.order)
}

// Chronological collision planning assigns the first reusable vertical label lane.
const prepareWateringMarkerPresentations = (
  wateringCycles: HostedWateringCycle[],
  chartTimeDomain: TimeDomain,
  plotWidth: number,
): HostedGen2WateringMarkerPresentation[] => {
  const laneRightEdges: number[] = []
  const domainWidth = chartTimeDomain[1] - chartTimeDomain[0]

  return [...wateringCycles]
    .sort(
      (left, right) =>
        left.startTimestampMs - right.startTimestampMs || left.id.localeCompare(right.id),
    )
    .map((cycle) => {
      const label = formatWateringCycleMarkerLabel(cycle)
      const normalizedPosition = Math.min(
        1,
        Math.max(0, (cycle.startTimestampMs - chartTimeDomain[0]) / domainWidth),
      )
      const horizontalPosition = normalizedPosition * plotWidth
      const labelWidth = Math.max(
        WATERING_LABEL_MINIMUM_WIDTH,
        label.length * WATERING_LABEL_ESTIMATED_CHARACTER_WIDTH +
          WATERING_LABEL_HORIZONTAL_PADDING,
      )
      const anchor: WateringLabelAnchor = normalizedPosition <= WATERING_LABEL_EDGE_THRESHOLD
        ? 'start'
        : normalizedPosition >= 1 - WATERING_LABEL_EDGE_THRESHOLD
          ? 'end'
          : 'middle'
      const estimatedLeft = anchor === 'start'
        ? horizontalPosition
        : anchor === 'end'
          ? horizontalPosition - labelWidth
          : horizontalPosition - labelWidth / 2
      const estimatedRight = anchor === 'start'
        ? horizontalPosition + labelWidth
        : anchor === 'end'
          ? horizontalPosition
          : horizontalPosition + labelWidth / 2
      const intervalLeft = Math.max(0, estimatedLeft)
      const intervalRight = Math.min(plotWidth, estimatedRight)
      let lane = laneRightEdges.findIndex(
        (rightEdge) => rightEdge + WATERING_LABEL_MINIMUM_GAP <= intervalLeft,
      )

      if (lane === -1) {
        lane = laneRightEdges.length
      }

      laneRightEdges[lane] = intervalRight

      return { cycle, label, lane, anchor }
    })
}

// Recharts supplies each marker coordinate to this lane-aware SVG label.
const WateringMarkerLabel = ({
  label,
  lane,
  anchor,
  markerId,
  viewBox,
}: WateringMarkerLabelProps) => {
  const x = viewBox?.x
  const plotTop = viewBox?.y

  if (
    typeof x !== 'number' ||
    typeof plotTop !== 'number' ||
    !Number.isFinite(x) ||
    !Number.isFinite(plotTop)
  ) {
    return null
  }

  return (
    <text
      className="hosted-gen2-trend-chart-watering-label"
      data-watering-label-lane={lane}
      data-watering-marker-id={markerId}
      fill="#1d4ed8"
      fontSize={11}
      fontWeight={800}
      pointerEvents="none"
      textAnchor={anchor}
      x={x}
      y={plotTop - WATERING_LABEL_BASE_OFFSET - lane * WATERING_LABEL_LANE_HEIGHT}
    >
      {label}
    </text>
  )
}

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
  series: HostedGen2ChartSeries | undefined,
): string => {
  if (!Number.isFinite(value)) {
    return 'Not available'
  }

  const maximumFractionDigits =
    series?.descriptor.derivedValue === 'relative-moisture-index' ? 1 : 2
  const formattedValue = value.toLocaleString([], { maximumFractionDigits })
  const unit = series?.unit ?? ''

  return unit ? `${formattedValue} ${unit}` : formattedValue
}

export default HostedGen2TrendChart
