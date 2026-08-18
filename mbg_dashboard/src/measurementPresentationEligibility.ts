import {
  normalizeHostedGen2ComparisonText,
  type HostedGen2CardCatalogDescriptor,
} from './hostedGen2Presentation.ts'
import type { HostedGen2MeasurementRow } from './types/hostedGen2Measurements.ts'

export type MeasurementEligibilityClassification =
  | 'eligible'
  | 'device-metadata-unusable'
  | 'non-finite'
  | 'outside-product-plausibility-range'
  | 'outside-provider-measurement-envelope'
  | 'invalid-discrete-value'
  | 'rule-not-defined'

export type MeasurementPresentationEligibility = {
  presentationEligible: boolean
  classification: MeasurementEligibilityClassification
  concerns: Array<'measurement-ceiling'>
  authority: 'device-metadata' | 'numeric' | 'manufacturer' | 'product-policy' | 'product-contract' | 'field-evidence' | 'none'
  diagnosticCode: string
}

const USABLE_QUALITY_VALUES = new Set(['good', 'diagnostic', 'ok', 'okay'])

export const evaluateMeasurementPresentationEligibility = (
  descriptor: HostedGen2CardCatalogDescriptor,
  row: HostedGen2MeasurementRow,
): MeasurementPresentationEligibility => {
  if (row.valid !== true || !USABLE_QUALITY_VALUES.has(normalizeHostedGen2ComparisonText(row.quality))) {
    return rejected('device-metadata-unusable', 'device-metadata', 'device_metadata_unusable')
  }
  if (typeof row.measurement_value !== 'number' || !Number.isFinite(row.measurement_value)) {
    return rejected('non-finite', 'numeric', 'non_finite_value')
  }

  const value = row.measurement_value
  switch (descriptor.key) {
    case 'air-temperature':
      return within(value, 0, 130, 'outside-product-plausibility-range', 'product-policy', 'air_temperature_outside_0_130_f')
    case 'soil-temperature':
      return within(value, 10, 130, 'outside-product-plausibility-range', 'product-policy', 'soil_temperature_outside_10_130_f')
    case 'humidity':
      return within(value, 0, 100, 'outside-provider-measurement-envelope', 'manufacturer', 'relative_humidity_outside_0_100_pct')
    case 'atmospheric-pressure':
      return within(value, 300, 1100, 'outside-provider-measurement-envelope', 'manufacturer', 'barometric_pressure_outside_300_1100_hpa')
    case 'moisture-m01':
    case 'moisture-m02':
    case 'moisture-m03':
      return within(value, 0, 23200, 'outside-provider-measurement-envelope', 'manufacturer', 'sen0308_outside_0_23200_count')
    case 'light-l01':
    case 'light-l02':
    case 'light-l03':
      if (value < 0 || value > 65535) {
        return rejected('outside-provider-measurement-envelope', 'manufacturer', 'sen0562_outside_0_65535_lux')
      }
      return eligible(value === 65535 ? ['measurement-ceiling'] : [], value === 65535 ? 'field-evidence' : 'manufacturer', value === 65535 ? 'sen0562_measurement_ceiling' : 'eligible')
    case 'reservoir-water':
      return value === 0 || value === 1
        ? eligible([], 'product-contract', 'eligible')
        : rejected('invalid-discrete-value', 'product-contract', 'reservoir_value_not_0_or_1')
    default:
      return { presentationEligible: true, classification: 'rule-not-defined', concerns: [], authority: 'none', diagnosticCode: 'rule_not_defined' }
  }
}

const within = (
  value: number,
  min: number,
  max: number,
  classification: Extract<MeasurementEligibilityClassification, 'outside-product-plausibility-range' | 'outside-provider-measurement-envelope'>,
  authority: Extract<MeasurementPresentationEligibility['authority'], 'product-policy' | 'manufacturer'>,
  diagnosticCode: string,
): MeasurementPresentationEligibility => value >= min && value <= max
  ? eligible([], authority, 'eligible')
  : rejected(classification, authority, diagnosticCode)

const eligible = (
  concerns: MeasurementPresentationEligibility['concerns'],
  authority: MeasurementPresentationEligibility['authority'],
  diagnosticCode: string,
): MeasurementPresentationEligibility => ({ presentationEligible: true, classification: 'eligible', concerns, authority, diagnosticCode })

const rejected = (
  classification: Exclude<MeasurementEligibilityClassification, 'eligible' | 'rule-not-defined'>,
  authority: MeasurementPresentationEligibility['authority'],
  diagnosticCode: string,
): MeasurementPresentationEligibility => ({ presentationEligible: false, classification, concerns: [], authority, diagnosticCode })
