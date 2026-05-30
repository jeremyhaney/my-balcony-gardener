export type HostedGen2AxisGroup =
  | 'temperature'
  | 'humidityMoisture'
  | 'pressure'
  | 'light'
  | 'adc'
  | 'unknown'

export type HostedGen2MeasurementDisplay = {
  name: string
  label: string
  unitLabel: string
  axisGroup: HostedGen2AxisGroup
  color: string
  defaultSelected: boolean
  diagnostic: boolean
}

export type HostedGen2MeasurementStatusLevel = 'good' | 'watch' | 'check' | 'neutral'

export type HostedGen2MeasurementStatus = {
  level: HostedGen2MeasurementStatusLevel
  label: string
  reason?: string
}

type HostedGen2MeasurementStatusInput = {
  measurementName: string | null | undefined
  measurementValue: number | null | undefined
  valid: boolean | null | undefined
}

const UNKNOWN_MEASUREMENT_COLOR = '#64748b'

const MEASUREMENT_DISPLAY: Record<string, HostedGen2MeasurementDisplay> = {
  air_temperature: {
    name: 'air_temperature',
    label: 'Air Temperature',
    unitLabel: 'F',
    axisGroup: 'temperature',
    color: '#ef4444',
    defaultSelected: true,
    diagnostic: false,
  },
  temperature: {
    name: 'temperature',
    label: 'Soil Temperature',
    unitLabel: 'F',
    axisGroup: 'temperature',
    color: '#9a3412',
    defaultSelected: false,
    diagnostic: false,
  },
  relative_humidity: {
    name: 'relative_humidity',
    label: 'Relative Humidity',
    unitLabel: '% / index',
    axisGroup: 'humidityMoisture',
    color: '#2563eb',
    defaultSelected: true,
    diagnostic: false,
  },
  moisture_index: {
    name: 'moisture_index',
    label: 'Moisture Index',
    unitLabel: '% / index',
    axisGroup: 'humidityMoisture',
    color: '#16a34a',
    defaultSelected: true,
    diagnostic: false,
  },
  barometric_pressure: {
    name: 'barometric_pressure',
    label: 'Barometric Pressure',
    unitLabel: 'hPa',
    axisGroup: 'pressure',
    color: '#7c3aed',
    defaultSelected: false,
    diagnostic: false,
  },
  ambient_light: {
    name: 'ambient_light',
    label: 'Ambient Light',
    unitLabel: 'lux',
    axisGroup: 'light',
    color: '#ca8a04',
    defaultSelected: false,
    diagnostic: false,
  },
  raw_adc: {
    name: 'raw_adc',
    label: 'Raw ADC',
    unitLabel: 'ADC',
    axisGroup: 'adc',
    color: '#374151',
    defaultSelected: false,
    diagnostic: true,
  },
}

const MEASUREMENT_ORDER = [
  'moisture_index',
  'air_temperature',
  'relative_humidity',
  'temperature',
  'barometric_pressure',
  'ambient_light',
  'raw_adc',
]

export const formatHostedGen2MeasurementLabel = (
  measurementName: string | null | undefined,
): string => {
  const normalizedName = measurementName?.trim()

  if (!normalizedName) {
    return 'Unknown Measurement'
  }

  return getHostedGen2MeasurementDisplay(normalizedName).label
}

export const getHostedGen2MeasurementDisplay = (
  measurementName: string | null | undefined,
): HostedGen2MeasurementDisplay => {
  const normalizedName = measurementName?.trim()

  if (!normalizedName) {
    return {
      name: '',
      label: 'Unknown Measurement',
      unitLabel: 'value',
      axisGroup: 'unknown',
      color: UNKNOWN_MEASUREMENT_COLOR,
      defaultSelected: false,
      diagnostic: false,
    }
  }

  return (
    MEASUREMENT_DISPLAY[normalizedName] ?? {
      name: normalizedName,
      label: toTitleCase(normalizedName),
      unitLabel: 'value',
      axisGroup: 'unknown',
      color: UNKNOWN_MEASUREMENT_COLOR,
      defaultSelected: false,
      diagnostic: isManualValidationMeasurement(normalizedName),
    }
  )
}

export const compareHostedGen2MeasurementNames = (
  left: string | null | undefined,
  right: string | null | undefined,
): number => {
  const leftName = left?.trim() ?? ''
  const rightName = right?.trim() ?? ''
  const leftIndex = MEASUREMENT_ORDER.indexOf(leftName)
  const rightIndex = MEASUREMENT_ORDER.indexOf(rightName)
  const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex
  const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex

  if (normalizedLeftIndex !== normalizedRightIndex) {
    return normalizedLeftIndex - normalizedRightIndex
  }

  return formatHostedGen2MeasurementLabel(leftName).localeCompare(
    formatHostedGen2MeasurementLabel(rightName),
  )
}

export const getPreferredHostedGen2MeasurementName = (
  measurementNames: string[],
): string | null => {
  for (const preferredName of ['moisture_index', 'air_temperature']) {
    if (measurementNames.includes(preferredName)) {
      return preferredName
    }
  }

  return measurementNames[0] ?? null
}

export const getDefaultHostedGen2MeasurementNames = (
  measurementNames: string[],
): string[] => {
  const defaultNames = measurementNames.filter(
    (measurementName) => getHostedGen2MeasurementDisplay(measurementName).defaultSelected,
  )

  return defaultNames.length > 0 ? defaultNames : measurementNames.slice(0, 1)
}

export const getHostedGen2MeasurementStatus = ({
  measurementName,
  measurementValue,
  valid,
}: HostedGen2MeasurementStatusInput): HostedGen2MeasurementStatus => {
  if (valid === false) {
    return { level: 'check', label: 'Check', reason: 'Invalid reading' }
  }

  if (measurementValue === null || measurementValue === undefined || !Number.isFinite(measurementValue)) {
    return { level: 'check', label: 'Check', reason: 'Reading unavailable' }
  }

  switch (measurementName?.trim()) {
    case 'air_temperature':
    case 'temperature':
      return getRangeStatus(measurementValue, {
        good: [55, 90],
        lowWatch: [45, 55],
        highWatch: [90, 98],
      })

    case 'moisture_index':
      return getRangeStatus(measurementValue, {
        good: [45, 85],
        lowWatch: [30, 45],
        highWatch: [85, 95],
      })

    case 'relative_humidity':
      return getRangeStatus(measurementValue, {
        good: [35, 75],
        lowWatch: [25, 35],
        highWatch: [75, 85],
      })

    case 'barometric_pressure':
      if (measurementValue >= 1000 && measurementValue <= 1025) {
        return { level: 'good', label: 'Normal Pressure' }
      }

      if (measurementValue >= 980 && measurementValue < 1000) {
        return { level: 'watch', label: 'Low Pressure' }
      }

      if (measurementValue > 1025 && measurementValue <= 1045) {
        return { level: 'watch', label: 'High Pressure' }
      }

      return { level: 'check', label: 'Check' }

    case 'ambient_light':
      if (measurementValue < 100) {
        return { level: 'neutral', label: 'Dark' }
      }

      if (measurementValue < 2500) {
        return { level: 'neutral', label: 'Shade' }
      }

      if (measurementValue < 10000) {
        return { level: 'good', label: 'Part Shade' }
      }

      if (measurementValue < 25000) {
        return { level: 'good', label: 'Part Sun' }
      }

      return { level: 'good', label: 'Full Sun' }

    case 'raw_adc':
      if (measurementValue === 0 || measurementValue === 4095) {
        return { level: 'check', label: 'Check' }
      }

      if (
        (measurementValue >= 1 && measurementValue <= 199) ||
        (measurementValue >= 3901 && measurementValue <= 4094)
      ) {
        return { level: 'watch', label: 'Watch' }
      }

      if (measurementValue >= 200 && measurementValue <= 3900) {
        return { level: 'good', label: 'Good' }
      }

      return { level: 'check', label: 'Check' }

    default:
      return { level: 'neutral', label: 'Coming soon' }
  }
}

const getRangeStatus = (
  value: number,
  ranges: {
    good: [number, number]
    lowWatch: [number, number]
    highWatch: [number, number]
  },
): HostedGen2MeasurementStatus => {
  if (value >= ranges.good[0] && value <= ranges.good[1]) {
    return { level: 'good', label: 'Good' }
  }

  if (
    (value >= ranges.lowWatch[0] && value < ranges.lowWatch[1]) ||
    (value > ranges.highWatch[0] && value <= ranges.highWatch[1])
  ) {
    return { level: 'watch', label: 'Watch' }
  }

  return { level: 'check', label: 'Check' }
}

const toTitleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())

const isManualValidationMeasurement = (value: string): boolean =>
  /\b(manual|validation)\b/i.test(value.replace(/[_-]+/g, ' '))
