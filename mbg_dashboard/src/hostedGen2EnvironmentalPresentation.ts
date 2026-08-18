export type HostedGen2EnvironmentalTone =
  | 'neutral'
  | 'env-blue'
  | 'env-cyan'
  | 'env-green'
  | 'env-orange'
  | 'env-red'
  | 'env-amber'
  | 'env-yellow'
  | 'env-deep-blue'
  | 'env-purple'
  | 'light-night'
  | 'light-shade'
  | 'light-filtered'
  | 'light-bright'
  | 'light-direct'
  | 'moisture-check'
  | 'moisture-too-dry'
  | 'moisture-dry'
  | 'moisture-moist'
  | 'moisture-well-watered'
  | 'moisture-very-wet'
  | 'moisture-saturated'
  | 'reservoir-water'

export type HostedGen2EnvironmentalScaleKey =
  | 'light'
  | 'air-temperature'
  | 'humidity'
  | 'pressure'
  | 'soil-temperature'
  | 'moisture'
  | 'reservoir'
  | 'neutral'

export type HostedGen2EnvironmentalScale = {
  key: HostedGen2EnvironmentalScaleKey
  label: string
  positionPercent: number | null
}

export const formatHostedGen2CardMeasurementValue = (
  value: number,
  unit: string | null | undefined,
): string => `${value.toLocaleString(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})} ${unit ?? ''}`.trim()

export const getHostedGen2CardPillLabel = ({
  conditionLabel,
  evidenceLabel,
  evidenceIsCurrent,
}: {
  conditionLabel: string | null
  evidenceLabel: string
  evidenceIsCurrent: boolean
}): string | null => evidenceIsCurrent ? conditionLabel : evidenceLabel

export type HostedGen2EnvironmentalPresentation = {
  label: string
  tone: Exclude<HostedGen2EnvironmentalTone, 'neutral'>
}

export const getHostedGen2EnvironmentalPresentation = (
  measurementName: string | null | undefined,
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (!Number.isFinite(value)) return null

  switch (measurementName?.trim().toLowerCase()) {
    case 'ambient_light':
      return getLightPresentation(value)
    case 'air_temperature':
      return getAirTemperaturePresentation(value)
    case 'relative_humidity':
      return getHumidityPresentation(value)
    case 'barometric_pressure':
      return value >= 300 && value <= 1100
        ? { label: 'Local Pressure', tone: 'env-purple' }
        : null
    case 'temperature':
    case 'soil temp':
      return getSoilTemperaturePresentation(value)
    case 'moisture_index':
      return getRelativeMoisturePresentation(value)
    case 'reservoir_liquid_detected':
      return getReservoirPresentation(value)
    default:
      return null
  }
}

export const getRelativeMoisturePresentation = (
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (!Number.isFinite(value)) return null
  if (value < 0) return { label: 'Check Sensor', tone: 'moisture-check' }
  if (value <= 20) return { label: 'Too Dry', tone: 'moisture-too-dry' }
  if (value <= 40) return { label: 'Dry', tone: 'moisture-dry' }
  if (value <= 70) return { label: 'Moist', tone: 'moisture-moist' }
  if (value <= 90) return { label: 'Well-watered', tone: 'moisture-well-watered' }
  if (value <= 105) return { label: 'Very Wet', tone: 'moisture-very-wet' }
  return { label: 'Saturated', tone: 'moisture-saturated' }
}

export const getHostedGen2EnvironmentalScale = (
  measurementName: string | null | undefined,
  value: number | null,
): HostedGen2EnvironmentalScale => {
  const name = measurementName?.trim().toLowerCase()
  const finiteValue = typeof value === 'number' && Number.isFinite(value) ? value : null

  switch (name) {
    case 'ambient_light':
      return {
        key: 'light',
        label: 'Light scale from night to direct sun',
        positionPercent: finiteValue === null ? null : getLightScalePosition(finiteValue),
      }
    case 'air_temperature':
      return rangedScale('air-temperature', 'Air temperature scale from very cold to extreme heat', finiteValue, 0, 130)
    case 'relative_humidity':
      return rangedScale('humidity', 'Humidity scale from very dry to very humid', finiteValue, 0, 100)
    case 'barometric_pressure':
      return rangedScale('pressure', 'Local barometric pressure measurement scale', finiteValue, 300, 1100)
    case 'temperature':
    case 'soil temp':
      return rangedScale('soil-temperature', 'Root-zone temperature scale from cold to hot', finiteValue, 10, 130)
    case 'moisture_index':
      return rangedScale('moisture', 'Moisture scale from dry to saturated and wet', finiteValue, 0, 105)
    case 'reservoir_liquid_detected':
      return rangedScale('reservoir', 'Reservoir scale from refill to water detected', finiteValue, 0, 1)
    default:
      return { key: 'neutral', label: 'Measurement scale unavailable', positionPercent: null }
  }
}

const rangedScale = (
  key: HostedGen2EnvironmentalScaleKey,
  label: string,
  value: number | null,
  min: number,
  max: number,
): HostedGen2EnvironmentalScale => ({
  key,
  label,
  positionPercent: value === null ? null : clampPercent(100 * (value - min) / (max - min)),
})

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value))

const getLightScalePosition = (value: number): number => {
  if (value < 100) return positionWithinBand(value, 0, 100, 0)
  if (value < 2500) return positionWithinBand(value, 100, 2500, 1)
  if (value < 10000) return positionWithinBand(value, 2500, 10000, 2)
  if (value < 25000) return positionWithinBand(value, 10000, 25000, 3)
  return positionWithinBand(value, 25000, 65535, 4)
}

const positionWithinBand = (
  value: number,
  min: number,
  max: number,
  bandIndex: number,
): number => clampPercent(bandIndex * 20 + 20 * (value - min) / (max - min))

export const getReservoirPresentation = (
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (value === 0) return { label: 'Refill Reservoir', tone: 'env-red' }
  if (value === 1) return { label: 'Water Detected', tone: 'reservoir-water' }
  return null
}

const getLightPresentation = (value: number): HostedGen2EnvironmentalPresentation | null => {
  if (value < 0 || value > 65535) return null
  if (value < 100) return { label: 'Very Low Light', tone: 'light-night' }
  if (value < 2500) return { label: 'Shade', tone: 'light-shade' }
  if (value < 10000) return { label: 'Filtered Light', tone: 'light-filtered' }
  if (value < 25000) return { label: 'Bright Light', tone: 'light-bright' }
  return { label: 'Direct Sun', tone: 'light-direct' }
}

const getAirTemperaturePresentation = (
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (value < 0 || value > 130) return null
  if (value < 40) return { label: 'Very Cold', tone: 'env-blue' }
  if (value < 55) return { label: 'Cool', tone: 'env-cyan' }
  if (value < 85) return { label: 'Mild', tone: 'env-green' }
  if (value < 95) return { label: 'Hot', tone: 'env-orange' }
  return { label: 'Extreme Heat', tone: 'env-red' }
}

const getSoilTemperaturePresentation = (
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (value < 10 || value > 130) return null
  if (value < 40) return { label: 'Cold Root Zone', tone: 'env-blue' }
  if (value < 55) return { label: 'Cool Root Zone', tone: 'env-cyan' }
  if (value < 85) return { label: 'Active Root Zone', tone: 'env-green' }
  if (value < 95) return { label: 'Warm Root Zone', tone: 'env-orange' }
  return { label: 'Hot Root Zone', tone: 'env-red' }
}

const getHumidityPresentation = (
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (value < 0 || value > 100) return null
  if (value < 25) return { label: 'Very Dry', tone: 'env-amber' }
  if (value < 35) return { label: 'Dry', tone: 'env-yellow' }
  if (value < 70) return { label: 'Moderate Humidity', tone: 'env-green' }
  if (value < 85) return { label: 'Humid', tone: 'env-blue' }
  return { label: 'Very Humid', tone: 'env-deep-blue' }
}
