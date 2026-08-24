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
  'soil temp': {
    name: 'soil temp',
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
    unitLabel: 'index',
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
  'soil temp',
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

const toTitleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())

const isManualValidationMeasurement = (value: string): boolean =>
  /\b(manual|validation)\b/i.test(value.replace(/[_-]+/g, ' '))
