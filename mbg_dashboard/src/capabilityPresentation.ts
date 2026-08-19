import {
  HOSTED_GEN2_CARD_CATALOG,
  doesHostedGen2RowMatchCard,
  getHostedGen2ChartSeriesDescriptors,
  type HostedGen2CardCatalogDescriptor,
  type HostedGen2ChartSeriesDescriptor,
} from './hostedGen2Presentation.ts'
import type { CommissionedDeviceCapability } from './types/deviceCapabilities'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements'

const catalogByKey = new Map(HOSTED_GEN2_CARD_CATALOG.map((descriptor) => [descriptor.key, descriptor]))

const EXACT_PRESENTATION_KEYS: Readonly<Record<string, readonly string[]>> = {
  bme280_air: ['air-temperature', 'humidity', 'atmospheric-pressure'],
  ds18b20_temperature: ['soil-temperature'],
  sen0308_m01: ['moisture-m01'],
  sen0308_m02: ['moisture-m02'],
  sen0308_m03: ['moisture-m03'],
  sen0562_l01: ['light-l01'],
  sen0562_l02: ['light-l02'],
  sen0562_l03: ['light-l03'],
  sen0204_wl01: ['reservoir-water'],
}

const SECTION_ORDER = new Map([['fire', 0], ['wind', 1], ['water', 2], ['earth', 3]])

export const getCapabilityCardDescriptors = (
  capabilities: readonly CommissionedDeviceCapability[],
): HostedGen2CardCatalogDescriptor[] => capabilities
  .flatMap((capability) => {
    const mappedKeys = EXACT_PRESENTATION_KEYS[capability.logicalSensorKey]
    if (!mappedKeys) return [buildUnsupportedDescriptor(capability)]

    const mapped = mappedKeys.flatMap((key) => {
      const descriptor = catalogByKey.get(key)
      return descriptor && capability.expectedMeasurementNames.includes(descriptor.canonicalMeasurementName)
        ? [{
            ...descriptor,
            label: getCapabilityCardLabel(capability, descriptor),
            physicalSensorId: capability.physicalSensorId ?? undefined,
            isCommissioned: true,
            sensorFamily: capability.sensorFamily,
            logicalChannel: capability.logicalChannel,
          }]
        : []
    })
    const mappedMeasurements = new Set(mapped.map((descriptor) => descriptor.canonicalMeasurementName))
    const unsupported = capability.expectedMeasurementNames
      .filter((measurementName) => !mappedMeasurements.has(measurementName))
      .map((measurementName) => buildUnsupportedDescriptor(capability, measurementName))
    return [...mapped, ...unsupported]
  })
  .sort((left, right) =>
    (SECTION_ORDER.get(left.section) ?? 99) - (SECTION_ORDER.get(right.section) ?? 99) ||
    left.order - right.order || left.key.localeCompare(right.key))

export const getCapabilityChartSeriesDescriptors = (
  cardDescriptors: readonly HostedGen2CardCatalogDescriptor[],
): HostedGen2ChartSeriesDescriptor[] => {
  const cardsByKey = new Map(cardDescriptors.map((card) => [card.key, card]))
  const hasDerivedAirSources = cardsByKey.has('air-temperature') && cardsByKey.has('humidity')
  return getHostedGen2ChartSeriesDescriptors()
    .filter((series) => series.derivedValue === 'feels-like' || series.derivedValue === 'dew-point'
      ? hasDerivedAirSources
      : cardsByKey.has(series.cardKey))
    .map((series) => {
      const cardDescriptor = cardsByKey.get(series.cardKey)
      return { ...series, label: cardDescriptor?.label ?? series.label, cardDescriptor }
    })
}

export const doesCapabilityChartRowMatchSeries = (
  row: HostedGen2MeasurementRow,
  series: HostedGen2ChartSeriesDescriptor,
): boolean => Boolean(
  series.cardDescriptor && doesHostedGen2RowMatchCard(row, series.cardDescriptor),
)

const getCapabilityCardLabel = (
  capability: CommissionedDeviceCapability,
  descriptor: HostedGen2CardCatalogDescriptor,
): string => {
  if (capability.logicalSensorKey === 'bme280_air' || capability.logicalSensorKey === 'ds18b20_temperature' || capability.logicalSensorKey === 'sen0204_wl01') {
    return descriptor.label
  }
  return capability.friendlyName ?? capability.locationLabel ?? descriptor.label
}

const buildUnsupportedDescriptor = (
  capability: CommissionedDeviceCapability,
  measurementName = capability.expectedMeasurementNames[0] ?? 'unsupported',
): HostedGen2CardCatalogDescriptor => ({
  key: `unsupported-${capability.logicalSensorKey}-${measurementName}`,
  section: 'earth',
  label: capability.friendlyName ?? capability.locationLabel ??
    `${toTitleCase(capability.sensorFamily)} ${capability.logicalChannel}`.trim(),
  sensorKey: capability.logicalSensorKey,
  physicalSensorId: capability.physicalSensorId ?? undefined,
  canonicalMeasurementName: measurementName,
  compatibleMeasurementNames: capability.expectedMeasurementNames,
  order: 1000,
  isUnsupported: true,
  isCommissioned: true,
  sensorFamily: capability.sensorFamily,
  logicalChannel: capability.logicalChannel,
})

const toTitleCase = (value: string): string => value
  .split(/[_\s-]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')
