import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
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
  compareHostedGen2MeasurementNames,
  getDefaultHostedGen2MeasurementNames,
  getHostedGen2MeasurementDisplay,
  type HostedGen2AxisGroup,
} from '../hostedGen2Display'
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

type ChartPoint = {
  timestamp: string
  timestampMs: number
} & Record<string, number | string>

type AxisConfig = {
  id: HostedGen2AxisGroup
  label: string
  compactLabel: string
  color: string
  domain?: AxisDomain
}

type AxisDomainValue = number | ((value: number) => number)

type AxisDomain = [AxisDomainValue, AxisDomainValue]
type TimeDomain = [number, number]

const MAX_WATERING_MARKER_COUNT = 6
const PRACTICAL_DRY_RAW = 14820
const WET_DRAINED_RAW = 11230
const WET_DRAINED_INDEX = 90

const UNUSABLE_CHART_QUALITY_VALUES = new Set([
  'failed',
  'missing',
  'disabled',
  'not_installed',
  'not installed',
  'unavailable',
])

const withDefaultAxisDomain = (
  lowerBound: number,
  upperBound: number,
): AxisDomain => [
  (dataMin: number) => Math.min(lowerBound, Math.floor(dataMin)),
  (dataMax: number) => Math.max(upperBound, Math.ceil(dataMax)),
]

const AXIS_CONFIGS: Record<HostedGen2AxisGroup, AxisConfig> = {
  temperature: {
    id: 'temperature',
    label: 'Temperature (F)',
    compactLabel: 'Temperature',
    color: '#ef4444',
    domain: withDefaultAxisDomain(20, 100),
  },
  humidityMoisture: {
    id: 'humidityMoisture',
    label: 'Humidity % / moisture index',
    compactLabel: 'Humidity / Moisture',
    color: '#0f766e',
    domain: [0, 100],
  },
  pressure: {
    id: 'pressure',
    label: 'Pressure (hPa)',
    compactLabel: 'Pressure',
    color: '#7c3aed',
    domain: withDefaultAxisDomain(950, 1050),
  },
  light: {
    id: 'light',
    label: 'Light (lux)',
    compactLabel: 'Light',
    color: '#ca8a04',
  },
  adc: {
    id: 'adc',
    label: 'Raw ADC diagnostic',
    compactLabel: 'ADC',
    color: '#374151',
  },
  unknown: {
    id: 'unknown',
    label: 'Value',
    compactLabel: 'Value',
    color: '#64748b',
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
  const chartReadyRows = useMemo(() => getChartReadyRows(rows), [rows])
  const numericRows = useMemo(
    () =>
      chartReadyRows.filter(
        (row) =>
          row.measurement_name?.trim() &&
          typeof row.measurement_value === 'number' &&
          Number.isFinite(row.measurement_value) &&
          Number.isFinite(new Date(row.measured_at).getTime()),
      ),
    [chartReadyRows],
  )

  const measurementNames = useMemo(
    () =>
      Array.from(new Set(numericRows.map((row) => row.measurement_name?.trim() ?? '')))
        .filter(Boolean)
        .sort(compareHostedGen2MeasurementNames),
    [numericRows],
  )

  const [selectedMeasurementNames, setSelectedMeasurementNames] = useState<string[]>(
    () => getDefaultHostedGen2MeasurementNames(measurementNames),
  )

  useEffect(() => {
    const stillAvailableSelections = selectedMeasurementNames.filter((measurementName) =>
      measurementNames.includes(measurementName),
    )

    if (stillAvailableSelections.length === 0 && measurementNames.length > 0) {
      setSelectedMeasurementNames(getDefaultHostedGen2MeasurementNames(measurementNames))
      return
    }

    if (stillAvailableSelections.length === selectedMeasurementNames.length) {
      return
    }

    setSelectedMeasurementNames(stillAvailableSelections)
  }, [measurementNames, selectedMeasurementNames])

  const selectedMeasurements = selectedMeasurementNames
    .filter((measurementName) => measurementNames.includes(measurementName))
    .sort(compareHostedGen2MeasurementNames)

  const chartData = useMemo(
    () => buildChartData(numericRows, selectedMeasurements),
    [numericRows, selectedMeasurements],
  )
  const chartTimeDomain = useMemo(
    () => getChartTimeDomain(chartData, wateringCycles),
    [chartData, wateringCycles],
  )
  const visibleWateringMarkers = useMemo(
    () => getVisibleWateringMarkers(wateringCycles, chartTimeDomain),
    [chartTimeDomain, wateringCycles],
  )
  const selectedAxisGroups = getSelectedAxisGroups(selectedMeasurements)
  const primaryAxisGroup = selectedAxisGroups[0]
  const rightAxisCount = Math.max(0, selectedAxisGroups.length - 1)
  const leftAxisWidth = 52
  const hasUsableRows = rows.length > 0
  const isBlockingLoad = isLoading && !hasUsableRows

  const handleToggleMeasurement = (measurementName: string) => {
    setSelectedMeasurementNames((currentNames) => {
      if (currentNames.includes(measurementName)) {
        return currentNames.filter((currentName) => currentName !== measurementName)
      }

      return [...currentNames, measurementName].sort(compareHostedGen2MeasurementNames)
    })
  }

  return (
    <section
      className={['hosted-gen2-trend-chart', className].filter(Boolean).join(' ')}
      data-guide-target="chart"
      aria-label="Gen2 Trend Chart"
    >
      {controls ? (
        <div className="hosted-gen2-trend-chart-header">
          {controls}
        </div>
      ) : null}

      {error ? <p className="hosted-gen2-trend-chart-error">{error}</p> : null}

      {isBlockingLoad ? (
        <p className="hosted-gen2-trend-chart-note">Loading Gen2 trend data...</p>
      ) : null}

      {!isBlockingLoad && measurementNames.length === 0 ? (
        <p className="hosted-gen2-trend-chart-note">
          No numeric Gen2 measurements are available for this device/window yet.
        </p>
      ) : null}

      {measurementNames.length > 0 ? (
        <div className="hosted-gen2-trend-chart-toggles" aria-label="Gen2 trend measurements">
          {measurementNames.map((measurementName) => {
            const display = getHostedGen2MeasurementDisplay(measurementName)
            const isSelected = selectedMeasurements.includes(measurementName)

            return (
              <label
                key={measurementName}
                className={[
                  'hosted-gen2-trend-chart-toggle',
                  isSelected ? 'is-selected' : '',
                  display.diagnostic ? 'is-diagnostic' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={
                  {
                    '--hosted-gen2-series-color': display.color,
                  } as CSSProperties
                }
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleMeasurement(measurementName)}
                />
                <span>{display.label}</span>
              </label>
            )
          })}
        </div>
      ) : null}

      {!isBlockingLoad && selectedMeasurements.length === 0 && measurementNames.length > 0 ? (
        <p className="hosted-gen2-trend-chart-note">
          Select one or more measurements to chart.
        </p>
      ) : null}

      {!isBlockingLoad && selectedMeasurements.length > 0 ? (
        <div className="hosted-gen2-trend-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 12, left: 12, bottom: 5 }}
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
              {selectedAxisGroups.map((axisGroup, index) => {
                const isRightAxis = index > 0
                const rightAxisIndex = index - 1

                return (
                  <YAxis
                    key={axisGroup}
                    yAxisId={axisGroup}
                    orientation={isRightAxis ? 'right' : 'left'}
                    width={isRightAxis ? getRightAxisWidth(rightAxisIndex, rightAxisCount) : leftAxisWidth}
                    tickMargin={3}
                    domain={AXIS_CONFIGS[axisGroup].domain}
                    axisLine={{ stroke: AXIS_CONFIGS[axisGroup].color }}
                    tickLine={{ stroke: AXIS_CONFIGS[axisGroup].color }}
                    tick={{ fill: AXIS_CONFIGS[axisGroup].color, fontSize: 12 }}
                    label={
                      {
                        value: getAxisLabel(axisGroup, index),
                        angle: isRightAxis ? 90 : -90,
                        position: isRightAxis ? 'insideRight' : 'insideLeft',
                        dx: isRightAxis
                          ? getRightAxisLabelDx(rightAxisIndex, rightAxisCount)
                          : -5,
                        fill: AXIS_CONFIGS[axisGroup].color,
                        style: { textAnchor: 'middle' },
                      }
                    }
                  />
                )
              })}
              <Tooltip
                formatter={(value, name) => {
                  const display = getHostedGen2MeasurementDisplay(String(name))
                  return [
                    formatTooltipMeasurementValue(Number(value), String(name)),
                    display.label,
                  ]
                }}
                labelFormatter={(label) => formatTooltipTimestamp(Number(label))}
                labelStyle={{ color: '#111827', fontWeight: 700, marginBottom: '0.25rem' }}
              />
              <Legend formatter={(value) => getHostedGen2MeasurementDisplay(String(value)).label} />
              {visibleWateringMarkers.map((cycle) => (
                <ReferenceLine
                  key={cycle.id}
                  x={cycle.startTimestampMs}
                  yAxisId={primaryAxisGroup}
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
              {selectedMeasurements.map((measurementName) => {
                const display = getHostedGen2MeasurementDisplay(measurementName)

                return (
                  <Line
                    key={measurementName}
                    name={measurementName}
                    yAxisId={display.axisGroup}
                    type="monotone"
                    dataKey={measurementName}
                    stroke={display.color}
                    strokeWidth={2}
                    dot={chartData.length < 24}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </section>
  )
}

const buildChartData = (
  rows: HostedGen2MeasurementRow[],
  selectedMeasurementNames: string[],
): ChartPoint[] => {
  const selectedNames = new Set(selectedMeasurementNames)
  const points = new Map<string, ChartPoint>()

  rows.forEach((row) => {
    const measurementName = row.measurement_name?.trim()

    if (!measurementName || !selectedNames.has(measurementName)) {
      return
    }

    const timestampMs = new Date(row.measured_at).getTime()

    if (!Number.isFinite(timestampMs) || !Number.isFinite(row.measurement_value)) {
      return
    }

    const existingPoint = points.get(row.measured_at)

    if (existingPoint) {
      existingPoint[measurementName] = row.measurement_value ?? 0
      return
    }

    points.set(row.measured_at, {
      timestamp: row.measured_at,
      timestampMs,
      [measurementName]: row.measurement_value ?? 0,
    })
  })

  return Array.from(points.values()).sort((left, right) => left.timestampMs - right.timestampMs)
}

const getChartReadyRows = (rows: HostedGen2MeasurementRow[]): HostedGen2MeasurementRow[] => {
  const filteredRows = rows.filter((row) => !shouldExcludeHostedChartRow(row))
  const derivedMoistureRows = rows
    .filter(isDisplayablePrimarySen0308RawAdcRow)
    .map((row) => ({
      ...row,
      measurement_name: 'moisture_index',
      measurement_unit: 'index',
      measurement_value: roundMoistureIndex(
        calculateGardenerMoistureIndex(row.measurement_value ?? Number.NaN),
      ),
    }))

  return [...filteredRows, ...derivedMoistureRows]
}

const shouldExcludeHostedChartRow = (row: HostedGen2MeasurementRow): boolean => {
  if (normalizeText(row.reason) === 'profile_not_installed') {
    return true
  }

  if (
    normalizeText(row.sensor_key) === 'soil_moisture_analog' &&
    normalizeText(row.measurement_name) === 'moisture_index'
  ) {
    return true
  }

  return false
}

const isDisplayablePrimarySen0308RawAdcRow = (
  row: HostedGen2MeasurementRow,
): row is HostedGen2MeasurementRow & { measurement_value: number } =>
  normalizeText(row.sensor_key) === 'sen0308_m01' &&
  normalizeText(row.measurement_name) === 'raw_adc' &&
  typeof row.measurement_value === 'number' &&
  Number.isFinite(row.measurement_value) &&
  row.valid === true &&
  !UNUSABLE_CHART_QUALITY_VALUES.has(normalizeText(row.quality)) &&
  Number.isFinite(new Date(row.measured_at).getTime())

const calculateGardenerMoistureIndex = (currentRaw: number): number =>
  (WET_DRAINED_INDEX * (PRACTICAL_DRY_RAW - currentRaw)) /
  (PRACTICAL_DRY_RAW - WET_DRAINED_RAW)

const roundMoistureIndex = (value: number): number => Math.round(value)

const getChartTimeDomain = (
  chartData: ChartPoint[],
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

const getSelectedAxisGroups = (measurementNames: string[]): HostedGen2AxisGroup[] => {
  const axisGroups = new Set<HostedGen2AxisGroup>()

  measurementNames.forEach((measurementName) => {
    axisGroups.add(getHostedGen2MeasurementDisplay(measurementName).axisGroup)
  })

  return Array.from(axisGroups).sort(compareAxisGroups)
}

const getAxisLabel = (
  axisGroup: HostedGen2AxisGroup,
  axisIndex: number,
): string => {
  const axisConfig = AXIS_CONFIGS[axisGroup]

  return axisIndex > 0 ? axisConfig.compactLabel : axisConfig.label
}

const getRightAxisLabelDx = (
  rightAxisIndex: number,
  rightAxisCount: number,
): number => {
  if (rightAxisCount === 2) {
    return rightAxisIndex === 0 ? -10 : 4
  }

  if (rightAxisCount >= 3) {
    return rightAxisIndex < rightAxisCount - 1 ? -10 : 4
  }

  return 4
}

const getRightAxisWidth = (
  rightAxisIndex: number,
  rightAxisCount: number,
): number => {
  if (rightAxisCount === 2) {
    return rightAxisIndex === 0 ? 60 : 46
  }

  if (rightAxisCount >= 3) {
    return rightAxisIndex < rightAxisCount - 1 ? 60 : 46
  }

  return 46
}

const compareAxisGroups = (
  left: HostedGen2AxisGroup,
  right: HostedGen2AxisGroup,
): number => getAxisGroupOrder(left) - getAxisGroupOrder(right)

const getAxisGroupOrder = (axisGroup: HostedGen2AxisGroup): number =>
  ['temperature', 'humidityMoisture', 'pressure', 'light', 'adc', 'unknown'].indexOf(axisGroup)

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

const formatNumber = (value: number): string =>
  Number.isFinite(value)
    ? value.toLocaleString([], { maximumFractionDigits: 2 })
    : 'Not available'

const formatTooltipMeasurementValue = (value: number, measurementName: string): string => {
  if (!Number.isFinite(value)) {
    return 'Not available'
  }

  switch (normalizeText(measurementName)) {
    case 'moisture_index':
      return value.toLocaleString([], { maximumFractionDigits: 0 })
    case 'relative_humidity':
      return `${value.toLocaleString([], { maximumFractionDigits: 1 })}%`
    case 'air_temperature':
    case 'temperature':
      return `${value.toLocaleString([], { maximumFractionDigits: 2 })} F`
    case 'barometric_pressure':
      return `${value.toLocaleString([], { maximumFractionDigits: 2 })} hPa`
    case 'ambient_light':
      return `${value.toLocaleString([], { maximumFractionDigits: 2 })} lux`
    case 'raw_adc':
      return `${value.toLocaleString([], { maximumFractionDigits: 0 })} counts`
    default:
      return formatNumber(value)
  }
}

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? ''

export default HostedGen2TrendChart
