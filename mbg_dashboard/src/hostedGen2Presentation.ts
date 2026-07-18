import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

// Public presentation-domain types.
export type HostedGen2ElementSectionKey = 'fire' | 'wind' | 'water' | 'earth'

export type HostedGen2CardKey =
  | 'light-l01'
  | 'light-l02'
  | 'light-l03'
  | 'air-temperature'
  | 'humidity'
  | 'atmospheric-pressure'
  | 'reservoir-water'
  | 'moisture-m01'
  | 'moisture-m02'
  | 'moisture-m03'
  | 'soil-temperature'

export type HostedGen2ChartGroupKey =
  | 'light'
  | 'moisture'
  | 'temperature'
  | 'humidity'
  | 'pressure'

export type HostedGen2CardCatalogDescriptor = {
  key: HostedGen2CardKey
  section: HostedGen2ElementSectionKey
  label: string
  sensorKey: string
  physicalSensorId?: string
  canonicalMeasurementName: string
  compatibleMeasurementNames: readonly string[]
  expectedUnit?: string
  order: number
}

export type HostedGen2SensorPresentationState =
  | 'Current'
  | 'Check Sensor'
  | 'Last Good Reading'
  | 'Reading Unavailable'
  | 'Sensor Not Detected'
  | 'Not Reported'
  | 'Not Current'
  | 'No Readings Yet'
  | 'Not Installed'

export type HostedGen2ReservoirPresentationState =
  | 'Refill Reservoir'
  | 'Water Status Unavailable'
  | 'Water Status Not Current'
  | 'Water Detected'

export type HostedGen2MoistureInterpretationLevel = 'check' | 'watch' | 'good'

export type HostedGen2MoistureInterpretation = {
  level: HostedGen2MoistureInterpretationLevel
  label:
    | 'Check Sensor'
    | 'Too Dry'
    | 'Dry'
    | 'Moist'
    | 'Well-watered'
    | 'Very Wet'
    | 'Saturated'
}

export type HostedGen2ChartSeriesDescriptor = {
  cardKey: HostedGen2CardKey
  group: HostedGen2ChartGroupKey
  label: string
  order: number
  derivedValue: 'relative-moisture-index' | null
}

export type HostedGen2PackageContext = {
  hasHistory: boolean
  latestPackageMeasuredAt: string | null
  latestPackageIsCurrent: boolean
  profileInstalled: boolean | null
  recentGoodRow?: HostedGen2MeasurementRow | null
  requiresReview?: boolean
}

// Approved element-section catalog.
export const HOSTED_GEN2_ELEMENT_SECTIONS: ReadonlyArray<{
  key: HostedGen2ElementSectionKey
  label: string
}> = [
  { key: 'fire', label: 'Light' },
  { key: 'wind', label: 'Air' },
  { key: 'water', label: 'Water' },
  { key: 'earth', label: 'Soil' },
]

// Frozen 11-card catalog.
export const HOSTED_GEN2_CARD_CATALOG: readonly HostedGen2CardCatalogDescriptor[] = [
  {
    key: 'light-l01', section: 'fire', label: 'Light L01', sensorKey: 'sen0562_l01',
    physicalSensorId: 'SEN0562-L01', canonicalMeasurementName: 'ambient_light',
    compatibleMeasurementNames: ['ambient_light'], expectedUnit: 'lux', order: 1,
  },
  {
    key: 'light-l02', section: 'fire', label: 'Light L02', sensorKey: 'sen0562_l02',
    physicalSensorId: 'SEN0562-L02', canonicalMeasurementName: 'ambient_light',
    compatibleMeasurementNames: ['ambient_light'], expectedUnit: 'lux', order: 2,
  },
  {
    key: 'light-l03', section: 'fire', label: 'Light L03', sensorKey: 'sen0562_l03',
    physicalSensorId: 'SEN0562-L03', canonicalMeasurementName: 'ambient_light',
    compatibleMeasurementNames: ['ambient_light'], expectedUnit: 'lux', order: 3,
  },
  {
    key: 'air-temperature', section: 'wind', label: 'Air Temperature', sensorKey: 'bme280_air',
    canonicalMeasurementName: 'air_temperature', compatibleMeasurementNames: ['air_temperature'], order: 4,
  },
  {
    key: 'humidity', section: 'wind', label: 'Humidity', sensorKey: 'bme280_air',
    canonicalMeasurementName: 'relative_humidity', compatibleMeasurementNames: ['relative_humidity'], order: 5,
  },
  {
    key: 'atmospheric-pressure', section: 'wind', label: 'Atmospheric Pressure', sensorKey: 'bme280_air',
    canonicalMeasurementName: 'barometric_pressure', compatibleMeasurementNames: ['barometric_pressure'], order: 6,
  },
  {
    key: 'reservoir-water', section: 'water', label: 'Reservoir Water', sensorKey: 'sen0204_wl01',
    physicalSensorId: 'WL01', canonicalMeasurementName: 'reservoir_liquid_detected',
    compatibleMeasurementNames: ['reservoir_liquid_detected'], order: 7,
  },
  {
    key: 'moisture-m01', section: 'earth', label: 'Moisture M01', sensorKey: 'sen0308_m01',
    physicalSensorId: 'SEN0308-M01', canonicalMeasurementName: 'raw_adc',
    compatibleMeasurementNames: ['raw_adc'], expectedUnit: 'count', order: 8,
  },
  {
    key: 'moisture-m02', section: 'earth', label: 'Moisture M02', sensorKey: 'sen0308_m02',
    physicalSensorId: 'SEN0308-M02', canonicalMeasurementName: 'raw_adc',
    compatibleMeasurementNames: ['raw_adc'], expectedUnit: 'count', order: 9,
  },
  {
    key: 'moisture-m03', section: 'earth', label: 'Moisture M03', sensorKey: 'sen0308_m03',
    physicalSensorId: 'SEN0308-M03', canonicalMeasurementName: 'raw_adc',
    compatibleMeasurementNames: ['raw_adc'], expectedUnit: 'count', order: 10,
  },
  {
    key: 'soil-temperature', section: 'earth', label: 'Soil Temperature',
    sensorKey: 'ds18b20_temperature', canonicalMeasurementName: 'soil temp',
    compatibleMeasurementNames: ['soil temp', 'temperature'], order: 11,
  },
]

// Approved chart groups.
export const HOSTED_GEN2_CHART_GROUPS: ReadonlyArray<{
  key: HostedGen2ChartGroupKey
  label: string
}> = [
  { key: 'light', label: 'Light' },
  { key: 'moisture', label: 'Moisture' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'humidity', label: 'Humidity' },
  { key: 'pressure', label: 'Pressure' },
]

export const DEFAULT_HOSTED_GEN2_CHART_GROUP: HostedGen2ChartGroupKey = 'moisture'

// Frozen Relative Moisture Index constants.
export const PRACTICAL_DRY_RAW = 14820
export const WET_DRAINED_RAW = 11230
export const WET_DRAINED_INDEX = 90

// Normalization and compound-identity helpers.
export const normalizeHostedGen2ComparisonText = (
  value: string | null | undefined,
): string => value?.trim().toLowerCase() ?? ''

export const getHostedGen2PhysicalSensorIdentity = (
  row: HostedGen2MeasurementRow,
): string =>
  normalizeHostedGen2ComparisonText(row.physical_sensor_id) ||
  normalizeHostedGen2ComparisonText(row.sensor_key)

export const getHostedGen2CanonicalMeasurementIdentity = (
  row: HostedGen2MeasurementRow,
): string => {
  const measurementName = normalizeHostedGen2ComparisonText(row.measurement_name)
  const sensorKey = normalizeHostedGen2ComparisonText(row.sensor_key)
  const sensorType = normalizeHostedGen2ComparisonText(row.sensor_type)

  return measurementName === 'temperature' &&
    (sensorKey === 'ds18b20_temperature' || sensorType.includes('ds18b20'))
    ? 'soil temp'
    : measurementName
}

export const getHostedGen2CompoundIdentity = (
  row: HostedGen2MeasurementRow,
): string =>
  [
    normalizeHostedGen2ComparisonText(row.device_id),
    getHostedGen2PhysicalSensorIdentity(row),
    getHostedGen2CanonicalMeasurementIdentity(row),
    normalizeHostedGen2ComparisonText(row.measurement_unit),
  ].join('|')

export const doesHostedGen2RowMatchCard = (
  row: HostedGen2MeasurementRow,
  descriptor: HostedGen2CardCatalogDescriptor,
): boolean => {
  const expectedPhysicalIdentity = normalizeHostedGen2ComparisonText(
    descriptor.physicalSensorId ?? descriptor.sensorKey,
  )

  return (
    getHostedGen2PhysicalSensorIdentity(row) === expectedPhysicalIdentity &&
    getHostedGen2CanonicalMeasurementIdentity(row) ===
      normalizeHostedGen2ComparisonText(descriptor.canonicalMeasurementName)
  )
}

export const findHostedGen2CardRow = (
  rows: readonly HostedGen2MeasurementRow[],
  descriptor: HostedGen2CardCatalogDescriptor,
  measuredAt: string,
): HostedGen2MeasurementRow | undefined =>
  rows.find(
    (row) =>
      row.measured_at === measuredAt &&
      doesHostedGen2RowMatchCard(row, descriptor),
  )

// Relative Moisture Index conversion and interpretation.
export const calculateGardenerMoistureIndex = (rawAdc: number): number =>
  (WET_DRAINED_INDEX * (PRACTICAL_DRY_RAW - rawAdc)) /
  (PRACTICAL_DRY_RAW - WET_DRAINED_RAW)

export const getGardenerMoistureInterpretation = (
  value: number,
): HostedGen2MoistureInterpretation => {
  if (value < 0) return { level: 'check', label: 'Check Sensor' }
  if (value <= 20) return { level: 'check', label: 'Too Dry' }
  if (value <= 40) return { level: 'watch', label: 'Dry' }
  if (value <= 70) return { level: 'good', label: 'Moist' }
  if (value <= 90) return { level: 'good', label: 'Well-watered' }
  if (value <= 105) return { level: 'watch', label: 'Very Wet' }
  return { level: 'check', label: 'Saturated' }
}

// Sensor and reservoir state evaluation.
export const getHostedGen2SensorPresentationState = (
  row: HostedGen2MeasurementRow | null | undefined,
  context: HostedGen2PackageContext,
): HostedGen2SensorPresentationState => {
  if (!context.hasHistory) return 'No Readings Yet'
  if (context.profileInstalled === false || isProfileNotInstalled(row)) return 'Not Installed'

  const isLatestPackageRow = Boolean(
    row &&
      context.latestPackageMeasuredAt &&
      row.measured_at === context.latestPackageMeasuredAt,
  )
  const requiresReview =
    context.requiresReview === true ||
    row?.valid === false ||
    normalizeHostedGen2ComparisonText(row?.quality) === 'failed'

  if (context.latestPackageMeasuredAt && !isLatestPackageRow) {
    return 'Not Reported'
  }

  if (!context.latestPackageMeasuredAt) {
    return 'Reading Unavailable'
  }

  if (!context.latestPackageIsCurrent) {
    return isUsableHostedGen2PresentationRow(row)
      ? 'Not Current'
      : 'Reading Unavailable'
  }

  if (isSensorNotDetected(row)) return 'Sensor Not Detected'

  if (isUsableHostedGen2PresentationRow(row)) {
    return requiresReview ? 'Check Sensor' : 'Current'
  }

  if (context.recentGoodRow) return 'Last Good Reading'
  if (requiresReview) return 'Check Sensor'

  return 'Reading Unavailable'
}

export const getHostedGen2ReservoirPresentationState = (
  row: HostedGen2MeasurementRow | null | undefined,
  context: HostedGen2PackageContext,
): HostedGen2ReservoirPresentationState => {
  if (
    !context.hasHistory ||
    context.profileInstalled === false ||
    isProfileNotInstalled(row) ||
    isSensorNotDetected(row)
  ) {
    return 'Water Status Unavailable'
  }

  const isLatestPackageRow = Boolean(
    row &&
      context.latestPackageMeasuredAt &&
      row.measured_at === context.latestPackageMeasuredAt,
  )

  if (
    !isLatestPackageRow ||
    !isUsableHostedGen2PresentationRow(row) ||
    (row.measurement_value !== 0 && row.measurement_value !== 1)
  ) {
    return 'Water Status Unavailable'
  }

  if (!context.latestPackageIsCurrent) {
    return 'Water Status Not Current'
  }

  return row.measurement_value === 0
    ? 'Refill Reservoir'
    : 'Water Detected'
}

// Chart-series descriptors and sensor counting.
export const getHostedGen2ChartSeriesDescriptors = (
  group?: HostedGen2ChartGroupKey,
): HostedGen2ChartSeriesDescriptor[] => {
  const descriptors: HostedGen2ChartSeriesDescriptor[] = [
    { cardKey: 'light-l01', group: 'light', label: 'Light L01', order: 1, derivedValue: null },
    { cardKey: 'light-l02', group: 'light', label: 'Light L02', order: 2, derivedValue: null },
    { cardKey: 'light-l03', group: 'light', label: 'Light L03', order: 3, derivedValue: null },
    { cardKey: 'moisture-m01', group: 'moisture', label: 'Moisture M01', order: 1, derivedValue: 'relative-moisture-index' },
    { cardKey: 'moisture-m02', group: 'moisture', label: 'Moisture M02', order: 2, derivedValue: 'relative-moisture-index' },
    { cardKey: 'moisture-m03', group: 'moisture', label: 'Moisture M03', order: 3, derivedValue: 'relative-moisture-index' },
    { cardKey: 'air-temperature', group: 'temperature', label: 'Air Temperature', order: 1, derivedValue: null },
    { cardKey: 'soil-temperature', group: 'temperature', label: 'Soil Temperature', order: 2, derivedValue: null },
    { cardKey: 'humidity', group: 'humidity', label: 'Humidity', order: 1, derivedValue: null },
    { cardKey: 'atmospheric-pressure', group: 'pressure', label: 'Atmospheric Pressure', order: 1, derivedValue: null },
  ]

  return group ? descriptors.filter((descriptor) => descriptor.group === group) : descriptors
}

export const getHostedGen2ChartSeriesIdentity = (
  row: HostedGen2MeasurementRow,
): string => getHostedGen2CompoundIdentity(row)

export const countHostedGen2UniquePhysicalSensors = (
  rows: readonly HostedGen2MeasurementRow[],
): number =>
  new Set(rows.map(getHostedGen2PhysicalSensorIdentity).filter(Boolean)).size

// Private quality and evidence predicates.
const UNUSABLE_QUALITY_VALUES = new Set([
  'failed',
  'missing',
  'disabled',
  'not_installed',
  'not installed',
  'unavailable',
  'stale',
])
const APPROVED_PRESENTATION_QUALITY_VALUES = new Set([
  'good',
  'diagnostic',
  'ok',
  'okay',
])

const isUsableHostedGen2PresentationRow = (
  row: HostedGen2MeasurementRow | null | undefined,
): row is HostedGen2MeasurementRow & { measurement_value: number } =>
  Boolean(
    row &&
      typeof row.measurement_value === 'number' &&
      Number.isFinite(row.measurement_value) &&
      row.valid === true &&
      APPROVED_PRESENTATION_QUALITY_VALUES.has(
        normalizeHostedGen2ComparisonText(row.quality),
      ) &&
      !UNUSABLE_QUALITY_VALUES.has(normalizeHostedGen2ComparisonText(row.quality)),
  )

const isProfileNotInstalled = (
  row: HostedGen2MeasurementRow | null | undefined,
): boolean =>
  (
    normalizeHostedGen2ComparisonText(row?.quality) === 'not_installed' ||
    normalizeHostedGen2ComparisonText(row?.quality) === 'not installed'
  ) &&
  normalizeHostedGen2ComparisonText(row?.reason) === 'profile_not_installed' &&
  row?.valid === false &&
  row?.measurement_value === null

const isSensorNotDetected = (
  row: HostedGen2MeasurementRow | null | undefined,
): boolean => normalizeHostedGen2ComparisonText(row?.reason).includes('not_detected')
