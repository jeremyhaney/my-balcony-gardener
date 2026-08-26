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
  | 'dew-point'
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
  background?: string
}

export const formatHostedGen2CardMeasurementValue = (
  value: number,
  unit: string | null | undefined,
): string => `${value.toLocaleString(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})} ${unit ?? ''}`.trim()

export const formatGardenerMoistureIndexCardValue = (value: number): string =>
  `${Math.round(value).toLocaleString()} index`

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

export type RelativeMoistureConditionBand = HostedGen2EnvironmentalPresentation & {
  upperBound: number | null
  upperInclusive: boolean
  scaleColor: string
}

// The single frontend authority for interpreting an unrounded Revised RMI value.
export const REVISED_RMI_CONDITION_BANDS: ReadonlyArray<RelativeMoistureConditionBand> = [
  { upperBound: 35, upperInclusive: true, label: 'Too Dry', tone: 'moisture-too-dry', scaleColor: '#d2ad72' },
  { upperBound: 55, upperInclusive: true, label: 'Dry', tone: 'moisture-dry', scaleColor: '#d3c986' },
  { upperBound: 100, upperInclusive: false, label: 'Moist', tone: 'moisture-moist', scaleColor: '#a7c987' },
  { upperBound: 225, upperInclusive: true, label: 'Well-watered', tone: 'moisture-well-watered', scaleColor: '#64aaa0' },
  { upperBound: 235, upperInclusive: false, label: 'Very Wet', tone: 'moisture-very-wet', scaleColor: '#36869a' },
  { upperBound: null, upperInclusive: true, label: 'Saturated', tone: 'moisture-saturated', scaleColor: '#1f6694' },
]

const REVISED_RMI_SCALE_LOWER_BOUND = 0
const REVISED_RMI_SCALE_UPPER_BOUND = 250
const REVISED_RMI_SCALE_BOUNDARIES = [
  REVISED_RMI_SCALE_LOWER_BOUND,
  ...REVISED_RMI_CONDITION_BANDS.flatMap(({ upperBound }) => upperBound === null ? [] : [upperBound]),
  REVISED_RMI_SCALE_UPPER_BOUND,
]

export const REVISED_RMI_SCALE_BACKGROUND = `linear-gradient(90deg, ${
  REVISED_RMI_CONDITION_BANDS.flatMap(({ scaleColor }, index) => {
    const start = 100 * index / REVISED_RMI_CONDITION_BANDS.length
    const end = 100 * (index + 1) / REVISED_RMI_CONDITION_BANDS.length
    return [`${scaleColor} ${start}%`, `${scaleColor} ${end}%`]
  }).join(', ')
})`

export const getHostedGen2EnvironmentalPresentation = (
  measurementName: string | null | undefined,
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (!Number.isFinite(value)) return null

  switch (measurementName?.trim().toLowerCase()) {
    case 'ambient_light':
      return getLightPresentation(value)
    case 'air_temperature':
    case 'feels_like':
      return getAirTemperaturePresentation(value)
    case 'dew_point':
      return getDewPointPresentation(value)
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
  const band = REVISED_RMI_CONDITION_BANDS.find(({ upperBound, upperInclusive }) =>
    upperBound === null || value < upperBound || (upperInclusive && value === upperBound))
  return band ? { label: band.label, tone: band.tone } : null
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
    case 'feels_like':
      return rangedScale('air-temperature', 'Feels Like scale from very cold to extreme heat', finiteValue, 0, 130)
    case 'dew_point':
      return rangedScale('dew-point', 'Dew point scale from dry air to very muggy air', finiteValue, 0, 85)
    case 'relative_humidity':
      return rangedScale('humidity', 'Humidity scale from very dry to very humid', finiteValue, 0, 100)
    case 'barometric_pressure':
      return rangedScale('pressure', 'Local barometric pressure measurement scale', finiteValue, 300, 1100)
    case 'temperature':
    case 'soil temp':
      return rangedScale('soil-temperature', 'Root-zone temperature scale from cold to hot', finiteValue, 10, 130)
    case 'moisture_index':
      return {
        key: 'moisture',
        label: 'Moisture scale from overdue-dry to saturated',
        positionPercent: finiteValue === null ? null : getRelativeMoistureScalePosition(finiteValue),
        background: REVISED_RMI_SCALE_BACKGROUND,
      }
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

const getRelativeMoistureScalePosition = (value: number): number => {
  const bandIndex = REVISED_RMI_CONDITION_BANDS.findIndex(({ upperBound, upperInclusive }) =>
    upperBound === null || value < upperBound || (upperInclusive && value === upperBound))
  const safeBandIndex = bandIndex < 0 ? REVISED_RMI_CONDITION_BANDS.length - 1 : bandIndex
  const min = REVISED_RMI_SCALE_BOUNDARIES[safeBandIndex]
  const max = REVISED_RMI_SCALE_BOUNDARIES[safeBandIndex + 1]
  const bandWidth = 100 / REVISED_RMI_CONDITION_BANDS.length
  return clampPercent(safeBandIndex * bandWidth + bandWidth * (value - min) / (max - min))
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

const getDewPointPresentation = (
  value: number,
): HostedGen2EnvironmentalPresentation | null => {
  if (value < -49 || value > 140) return null
  if (value <= 55) return { label: 'Dry & Comfortable', tone: 'env-green' }
  if (value < 65) return { label: 'Getting Muggy', tone: 'env-blue' }
  if (value < 75) return { label: 'Muggy', tone: 'env-deep-blue' }
  return { label: 'Very Muggy', tone: 'env-purple' }
}
