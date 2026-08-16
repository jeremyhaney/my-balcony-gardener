import {
  describeLastGoodEvidenceSource,
  resolveCommissionedCardEvidence,
} from '../commissionedCardEvidence'
import {
  HOSTED_GEN2_CARD_CATALOG,
  HOSTED_GEN2_ELEMENT_SECTIONS,
  PRACTICAL_DRY_RAW,
  WET_DRAINED_INDEX,
  WET_DRAINED_RAW,
  calculateGardenerMoistureIndex,
  getGardenerMoistureInterpretation,
  getHostedGen2CompoundIdentity,
  getHostedGen2ReservoirPresentationState,
  getHostedGen2SensorPresentationState,
  normalizeHostedGen2ComparisonText,
  type HostedGen2CardCatalogDescriptor,
  type HostedGen2ReservoirPresentationState,
  type HostedGen2SensorPresentationState,
} from '../hostedGen2Presentation'
import {
  getHostedGen2TrendSummary,
  type HostedGen2SparklinePoint,
  type HostedGen2TrendDirection,
} from '../hostedGen2TrendSummary'
import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import './HostedGen2Measurements.css'

type HostedGen2MeasurementsProps = {
  rows: HostedGen2MeasurementRow[]
  cardDescriptors?: readonly HostedGen2CardCatalogDescriptor[]
  isLoading: boolean
  error: string | null
  fallbackDeviceLabel: string
  className?: string
}

type CardTone = 'good' | 'watch' | 'check' | 'neutral'
type TransportState = 'loading' | 'error' | null

type LatestPackage = {
  measuredAt: string
  measuredAtMs: number
}

type HostedGen2CatalogCardModel = {
  descriptor: HostedGen2CardCatalogDescriptor
  latestPackageMeasuredAt: string | null
  latestRow: HostedGen2MeasurementRow | null
  displayRow: HostedGen2MeasurementRow | null
  recentGoodRow: HostedGen2MeasurementRow | null
  state: HostedGen2SensorPresentationState | null
  reservoirState: HostedGen2ReservoirPresentationState | null
  pillLabel: string
  primaryValue: string
  tone: CardTone
  trendRows: HostedGen2MeasurementRow[]
  trendRow: HostedGen2MeasurementRow | null
  rawAdc: number | null
  moistureIndex: number | null
  transportState: TransportState
}

const APPROVED_QUALITY_VALUES = new Set(['good', 'diagnostic', 'ok', 'okay'])
const MOISTURE_CARD_KEYS = new Set(['moisture-m01', 'moisture-m02', 'moisture-m03'])
const RESERVOIR_CARD_KEY = 'reservoir-water'

const SPARKLINE_WIDTH = 64
const SPARKLINE_HEIGHT = 24
const SPARKLINE_PADDING = 3

const TREND_DIRECTION_SYMBOLS: Partial<Record<HostedGen2TrendDirection, string>> = {
  rising: '\u2197',
  falling: '\u2198',
  stable: '\u2192',
}

const HostedGen2Measurements = ({
  rows,
  cardDescriptors = HOSTED_GEN2_CARD_CATALOG,
  isLoading,
  error,
  className = '',
}: HostedGen2MeasurementsProps) => {
  // Package selection is chronological and preserves the source timestamp string.
  const latestPackage = getLatestPackage(rows)
  const hasRetainedRows = rows.length > 0
  const isRefreshing = isLoading && hasRetainedRows
  const transportState: TransportState =
    isLoading && !hasRetainedRows ? 'loading' : error && !hasRetainedRows ? 'error' : null
  const cards = cardDescriptors.map((descriptor) =>
    buildCatalogCardModel({
      descriptor,
      rows,
      latestPackage,
      transportState,
      successfulEmpty: !isLoading && !error && rows.length === 0,
    }),
  )

  return (
    <section
      aria-label="Garden Readings"
      className={['hosted-gen2-measurements', className].filter(Boolean).join(' ')}
      data-guide-target="readings"
    >
      <div className="hosted-gen2-measurements-header">
        <div>
          <h2>Garden Readings</h2>
          <p className="hosted-gen2-measurements-updated">
            {latestPackage
              ? `Latest reading ${formatTimestamp(latestPackage.measuredAt)}`
              : 'Latest reading not available'}
          </p>
        </div>
        {isRefreshing ? (
          <span className="hosted-gen2-measurements-refresh">Refreshing</span>
        ) : null}
      </div>

      {error ? <p className="hosted-gen2-measurements-error">{error}</p> : null}
      {transportState === 'loading' ? (
        <p className="hosted-gen2-measurements-note">Loading Gen2 measurements...</p>
      ) : null}

      <div className="hosted-gen2-measurements-groups">
        {HOSTED_GEN2_ELEMENT_SECTIONS.map((section) => (
          <section
            className={[
              'hosted-gen2-measurements-group',
              `is-${section.key}`,
            ].join(' ')}
            key={section.key}
          >
            <h3 className="hosted-gen2-measurements-group-title">{section.label}</h3>
            <div className="hosted-gen2-measurements-card-grid">
              {cards
                .filter((card) => card.descriptor.section === section.key)
                .map((card) => (
                  <MeasurementCard card={card} key={card.descriptor.key} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

const MeasurementCard = ({ card }: { card: HostedGen2CatalogCardModel }) => {
  const trendSummary =
    card.trendRow && card.trendRows.length > 0
      ? getHostedGen2TrendSummary(card.trendRow, card.trendRows)
      : null

  return (
    <article className={`hosted-gen2-measurements-card is-${card.tone}`}>
      <div className="hosted-gen2-measurements-card-main">
        <h3>{card.descriptor.label}</h3>
        <span className="hosted-gen2-measurements-status-pill">{card.pillLabel}</span>
      </div>
      <p className="hosted-gen2-measurements-value">{card.primaryValue}</p>
      {card.descriptor.isUnsupported ? (
        <p className="hosted-gen2-measurements-note">
          Commissioned sensor; frontend presentation is not yet supported.
        </p>
      ) : null}

      {trendSummary ? (
        <div
          className={[
            'hosted-gen2-measurements-trend',
            `is-${trendSummary.direction.replace(/_/g, '-')}`,
          ].join(' ')}
        >
          <div className="hosted-gen2-measurements-trend-text">
            <span className="hosted-gen2-measurements-trend-label">
              Trend: <strong>{formatTrendLabel(trendSummary.direction, trendSummary.label)}</strong>
            </span>
            {trendSummary.deltaLabel ? (
              <span className="hosted-gen2-measurements-trend-delta">
                {trendSummary.deltaLabel}
              </span>
            ) : null}
          </div>
          {trendSummary.sparklinePoints ? (
            <TrendSparkline points={trendSummary.sparklinePoints} />
          ) : null}
        </div>
      ) : null}

      {card.transportState !== 'loading' ? <MeasurementDetails card={card} /> : null}
    </article>
  )
}

const MeasurementDetails = ({ card }: { card: HostedGen2CatalogCardModel }) => {
  const row = card.latestRow

  return (
    <details className="hosted-gen2-measurements-details">
      <summary>Sensor details</summary>
      <dl className="hosted-gen2-measurements-status">
        <dt>State</dt>
        <dd>{card.reservoirState ?? card.state ?? 'Reading Unavailable'}</dd>

        <dt>Expected sensor key</dt>
        <dd>{card.descriptor.sensorKey}</dd>

        {card.descriptor.physicalSensorId ? (
          <>
            <dt>Expected physical sensor ID</dt>
            <dd>{card.descriptor.physicalSensorId}</dd>
          </>
        ) : null}

        <dt>Expected measurement</dt>
        <dd>{card.descriptor.canonicalMeasurementName}</dd>

        <dt>Latest reading time</dt>
        <dd>{formatTimestamp(card.latestPackageMeasuredAt)}</dd>

        {card.displayRow ? (
          <>
            <dt>Display source</dt>
            <dd>{formatDisplaySource(card)}</dd>
            <dt>Displayed measured at</dt>
            <dd>{formatTimestamp(card.displayRow.measured_at)}</dd>
          </>
        ) : null}

        {card.recentGoodRow && row ? (
          <>
            <dt>Recent good evidence</dt>
            <dd>{formatLastGoodEvidence(card)}</dd>
          </>
        ) : null}

        {card.rawAdc !== null && card.displayRow ? (
          <>
            <dt>Raw ADC evidence</dt>
            <dd>{formatRawAdcValue(card.rawAdc)}</dd>
            <dt>Raw ADC source timestamp</dt>
            <dd>{formatTimestamp(card.displayRow.measured_at)}</dd>
            <dt>Moisture formula</dt>
            <dd>{`${WET_DRAINED_INDEX} * (${PRACTICAL_DRY_RAW} - raw_adc) / (${PRACTICAL_DRY_RAW} - ${WET_DRAINED_RAW})`}</dd>
            <dt>Unrounded index</dt>
            <dd>
              {card.moistureIndex?.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{' '}
              index
            </dd>
          </>
        ) : null}

        {row ? (
          <>
            <dt>Latest row measured at</dt>
            <dd>{formatTimestamp(row.measured_at)}</dd>
            <dt>Sensor key</dt>
            <dd>{formatNullableText(row.sensor_key)}</dd>
            <dt>Sensor type</dt>
            <dd>{formatNullableText(row.sensor_type)}</dd>
            {row.physical_sensor_id ? (
              <>
                <dt>Physical sensor ID</dt>
                <dd>{row.physical_sensor_id}</dd>
              </>
            ) : null}
            <dt>Latest valid</dt>
            <dd>{formatNullableBoolean(row.valid)}</dd>
            <dt>Latest quality</dt>
            <dd>{formatNullableText(row.quality)}</dd>
            <dt>Latest reason</dt>
            <dd>{formatNullableText(row.reason)}</dd>
          </>
        ) : null}
      </dl>
    </details>
  )
}

const TrendSparkline = ({ points }: { points: HostedGen2SparklinePoint[] }) => {
  const innerWidth = SPARKLINE_WIDTH - SPARKLINE_PADDING * 2
  const innerHeight = SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2
  const polylinePoints = points
    .map((point) => {
      const x = SPARKLINE_PADDING + point.x * innerWidth
      const y = SPARKLINE_PADDING + point.y * innerHeight
      return `${formatSvgNumber(x)},${formatSvgNumber(y)}`
    })
    .join(' ')

  return (
    <svg
      aria-hidden="true"
      className="hosted-gen2-measurements-sparkline"
      focusable="false"
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      width={SPARKLINE_WIDTH}
    >
      <polyline points={polylinePoints} />
    </svg>
  )
}

// Catalog construction keeps package membership, transport state, and sensor evidence separate.
const buildCatalogCardModel = ({
  descriptor,
  rows,
  latestPackage,
  transportState,
  successfulEmpty,
}: {
  descriptor: HostedGen2CardCatalogDescriptor
  rows: HostedGen2MeasurementRow[]
  latestPackage: LatestPackage | null
  transportState: TransportState
  successfulEmpty: boolean
}): HostedGen2CatalogCardModel => {
  if (transportState) {
    return buildTransportCard(descriptor, latestPackage, transportState)
  }

  if (rows.length > 0 && !latestPackage) {
    return buildUnavailableCard(descriptor, null)
  }

  if (descriptor.isUnsupported) {
    const latestRow = rows
      .filter((row) => normalizeHostedGen2ComparisonText(row.sensor_key) === descriptor.sensorKey)
      .sort((left, right) => new Date(right.measured_at).getTime() - new Date(left.measured_at).getTime())[0] ?? null
    return {
      ...buildStateOnlyCard(descriptor, latestPackage, latestRow ? 'Check Sensor' : 'No Readings Yet', 'neutral'),
      latestRow,
      pillLabel: latestRow ? 'Unsupported Presentation' : 'Awaiting Evidence',
    }
  }

  const commissionedEvidence = resolveCommissionedCardEvidence(descriptor, rows)
  const latestRow = commissionedEvidence.latestMatchingRow
  const latestPackageIsCurrent = commissionedEvidence.latestMatchingIsCurrent
  const shouldDisplayLastGood = Boolean(
    commissionedEvidence.lastGoodRow &&
    (!commissionedEvidence.appearsInLatestPackage ||
      commissionedEvidence.lastGoodRow !== latestRow),
  )
  const recentGoodRow = shouldDisplayLastGood ? commissionedEvidence.lastGoodRow : null
  const requiresReview = Boolean(
    latestRow &&
      (latestRow.valid === false ||
        !APPROVED_QUALITY_VALUES.has(normalizeHostedGen2ComparisonText(latestRow.quality))),
  )

  if (descriptor.key === RESERVOIR_CARD_KEY) {
    if (successfulEmpty) {
      return buildStateOnlyCard(descriptor, null, 'No Readings Yet', 'neutral')
    }

    return buildReservoirCard({
      descriptor,
      latestPackage,
      latestRow,
      recentGoodRow,
      latestPackageIsCurrent,
    })
  }

  const evaluatedState = getHostedGen2SensorPresentationState(latestRow, {
    hasHistory: Boolean(latestRow),
    latestPackageMeasuredAt: latestPackage?.measuredAt ?? null,
    latestPackageIsCurrent,
    profileInstalled: null,
    recentGoodRow,
    requiresReview,
    commissioned: descriptor.isCommissioned,
  })
  const state = recentGoodRow
    ? 'Last Good Reading'
    : descriptor.isCommissioned && !latestRow
      ? 'No Readings Yet'
      : evaluatedState
  const displayRow = getDisplayRowForState(state, latestRow, recentGoodRow)

  return buildSensorCard({
    descriptor,
    rows,
    latestPackage,
    latestRow,
    displayRow,
    recentGoodRow,
    state,
  })
}

// Value and state derivation uses dedicated standard, moisture, and reservoir paths.
const buildSensorCard = ({
  descriptor,
  rows,
  latestPackage,
  latestRow,
  displayRow,
  recentGoodRow,
  state,
}: {
  descriptor: HostedGen2CardCatalogDescriptor
  rows: HostedGen2MeasurementRow[]
  latestPackage: LatestPackage | null
  latestRow: HostedGen2MeasurementRow | null
  displayRow: HostedGen2MeasurementRow | null
  recentGoodRow: HostedGen2MeasurementRow | null
  state: HostedGen2SensorPresentationState
}): HostedGen2CatalogCardModel => {
  const isMoisture = MOISTURE_CARD_KEYS.has(descriptor.key)
  const rawAdc = isMoisture && isFiniteRowValue(displayRow) ? displayRow.measurement_value : null
  const moistureIndex = rawAdc === null ? null : calculateGardenerMoistureIndex(rawAdc)
  const interpretation =
    state === 'Current' && moistureIndex !== null
      ? getGardenerMoistureInterpretation(moistureIndex)
      : null
  const trend = prepareTrendEvidence(descriptor, rows, displayRow, state)

  return {
    descriptor,
    latestPackageMeasuredAt: latestPackage?.measuredAt ?? null,
    latestRow,
    displayRow,
    recentGoodRow,
    state,
    reservoirState: null,
    pillLabel: interpretation?.label ?? state,
    primaryValue:
      moistureIndex === null
        ? formatMeasurementValue(displayRow)
        : `${Math.round(moistureIndex).toLocaleString()} index`,
    tone: interpretation?.level ?? getSensorStateTone(state),
    trendRows: trend.rows,
    trendRow: trend.currentRow,
    rawAdc,
    moistureIndex,
    transportState: null,
  }
}

const buildReservoirCard = ({
  descriptor,
  latestPackage,
  latestRow,
  recentGoodRow,
  latestPackageIsCurrent,
}: {
  descriptor: HostedGen2CardCatalogDescriptor
  latestPackage: LatestPackage | null
  latestRow: HostedGen2MeasurementRow | null
  recentGoodRow: HostedGen2MeasurementRow | null
  latestPackageIsCurrent: boolean
}): HostedGen2CatalogCardModel => {
  const evidenceRow = recentGoodRow ?? latestRow
  const sharedReservoirState = getHostedGen2ReservoirPresentationState(evidenceRow, {
    hasHistory: true,
    latestPackageMeasuredAt: latestPackage?.measuredAt ?? null,
    latestPackageIsCurrent,
    profileInstalled: null,
    commissioned: descriptor.isCommissioned,
  })
  const reservoirState = recentGoodRow
    ? 'Water Status Not Current'
    :
    sharedReservoirState === 'Water Status Not Current' &&
    !isRecognizedReservoirValue(evidenceRow)
      ? 'Water Status Unavailable'
      : sharedReservoirState
  const displayRow =
    reservoirState === 'Water Detected' ||
    reservoirState === 'Refill Reservoir' ||
    reservoirState === 'Water Status Not Current'
      ? evidenceRow
      : null

  return {
    descriptor,
    latestPackageMeasuredAt: latestPackage?.measuredAt ?? null,
    latestRow,
    displayRow,
    recentGoodRow,
    state: null,
    reservoirState,
    pillLabel: recentGoodRow ? 'Last Good Reading' : reservoirState,
    primaryValue: formatReservoirValue(displayRow),
    tone: getReservoirTone(reservoirState),
    trendRows: [],
    trendRow: null,
    rawAdc: null,
    moistureIndex: null,
    transportState: null,
  }
}

const buildTransportCard = (
  descriptor: HostedGen2CardCatalogDescriptor,
  latestPackage: LatestPackage | null,
  transportState: Exclude<TransportState, null>,
): HostedGen2CatalogCardModel => ({
  descriptor,
  latestPackageMeasuredAt: latestPackage?.measuredAt ?? null,
  latestRow: null,
  displayRow: null,
  recentGoodRow: null,
  state: transportState === 'loading' ? null : 'Reading Unavailable',
  reservoirState: null,
  pillLabel: transportState === 'loading' ? 'Loading' : 'Reading Unavailable',
  primaryValue: transportState === 'loading' ? 'Loading' : 'Not available',
  tone: transportState === 'loading' ? 'neutral' : 'check',
  trendRows: [],
  trendRow: null,
  rawAdc: null,
  moistureIndex: null,
  transportState,
})

const buildUnavailableCard = (
  descriptor: HostedGen2CardCatalogDescriptor,
  latestPackage: LatestPackage | null,
): HostedGen2CatalogCardModel => ({
  ...buildStateOnlyCard(descriptor, latestPackage, 'Reading Unavailable', 'check'),
})

const buildStateOnlyCard = (
  descriptor: HostedGen2CardCatalogDescriptor,
  latestPackage: LatestPackage | null,
  state: HostedGen2SensorPresentationState,
  tone: CardTone,
): HostedGen2CatalogCardModel => ({
  descriptor,
  latestPackageMeasuredAt: latestPackage?.measuredAt ?? null,
  latestRow: null,
  displayRow: null,
  recentGoodRow: null,
  state,
  reservoirState: null,
  pillLabel: state,
  primaryValue: 'Not available',
  tone,
  trendRows: [],
  trendRow: null,
  rawAdc: null,
  moistureIndex: null,
  transportState: null,
})

const getLatestPackage = (rows: readonly HostedGen2MeasurementRow[]): LatestPackage | null => {
  let latest: LatestPackage | null = null

  rows.forEach((row) => {
    const measuredAtMs = new Date(row.measured_at).getTime()
    if (!Number.isFinite(measuredAtMs)) return

    if (!latest || measuredAtMs > latest.measuredAtMs) {
      latest = { measuredAt: row.measured_at, measuredAtMs }
    }
  })

  return latest
}

const getDisplayRowForState = (
  state: HostedGen2SensorPresentationState,
  latestRow: HostedGen2MeasurementRow | null,
  recentGoodRow: HostedGen2MeasurementRow | null,
): HostedGen2MeasurementRow | null => {
  if (state === 'Last Good Reading') return recentGoodRow
  if (state === 'Current' || state === 'Not Current') return latestRow
  if (state === 'Check Sensor' && isFiniteRowValue(latestRow)) return latestRow
  return null
}

// Trend preparation filters exact compound identity before deriving per-probe RMI rows.
const prepareTrendEvidence = (
  descriptor: HostedGen2CardCatalogDescriptor,
  rows: readonly HostedGen2MeasurementRow[],
  displayRow: HostedGen2MeasurementRow | null,
  state: HostedGen2SensorPresentationState,
): { rows: HostedGen2MeasurementRow[]; currentRow: HostedGen2MeasurementRow | null } => {
  if (!displayRow || (state !== 'Current' && state !== 'Last Good Reading')) {
    return { rows: [], currentRow: null }
  }

  const identity = getHostedGen2CompoundIdentity(displayRow)
  const identityRows = rows.filter((row) => getHostedGen2CompoundIdentity(row) === identity)

  if (!MOISTURE_CARD_KEYS.has(descriptor.key)) {
    return { rows: identityRows, currentRow: displayRow }
  }

  const derivedRows = identityRows.map((row) => ({
    ...row,
    measurement_name: 'moisture_index',
    measurement_unit: 'index',
    measurement_value: isFiniteRowValue(row)
      ? calculateGardenerMoistureIndex(row.measurement_value)
      : null,
  }))
  const currentRow = derivedRows.find((row) => row.measured_at === displayRow.measured_at) ?? null

  return { rows: derivedRows, currentRow }
}

const getSensorStateTone = (state: HostedGen2SensorPresentationState): CardTone => {
  if (state === 'Current') return 'good'
  if (state === 'Last Good Reading' || state === 'Not Current') return 'watch'
  if (state === 'No Readings Yet' || state === 'Not Installed') return 'neutral'
  return 'check'
}

const getReservoirTone = (state: HostedGen2ReservoirPresentationState): CardTone => {
  if (state === 'Water Detected') return 'good'
  if (state === 'Water Status Not Current') return 'watch'
  return 'check'
}

const formatReservoirValue = (row: HostedGen2MeasurementRow | null): string => {
  if (!isRecognizedReservoirValue(row)) {
    return 'Not available'
  }
  return row.measurement_value === 1 ? 'Detected' : 'Not detected'
}

const isRecognizedReservoirValue = (
  row: HostedGen2MeasurementRow | null | undefined,
): row is HostedGen2MeasurementRow & { measurement_value: 0 | 1 } =>
  row?.measurement_value === 0 || row?.measurement_value === 1

const formatMeasurementValue = (row: HostedGen2MeasurementRow | null): string => {
  if (!isFiniteRowValue(row)) return 'Not available'
  return `${row.measurement_value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${row.measurement_unit ?? ''}`.trim()
}

const isFiniteRowValue = (
  row: HostedGen2MeasurementRow | null | undefined,
): row is HostedGen2MeasurementRow & { measurement_value: number } =>
  Boolean(
    row &&
      typeof row.measurement_value === 'number' &&
      Number.isFinite(row.measurement_value),
  )

const formatDisplaySource = (card: HostedGen2CatalogCardModel): string => {
  if (card.recentGoodRow) return 'Last good reading'
  if (card.state === 'Not Current') return 'Latest non-current reading'
  return 'Latest reading'
}

const formatLastGoodEvidence = (card: HostedGen2CatalogCardModel): string => {
  if (!card.recentGoodRow) return 'Not available'
  const sourceDescription = describeLastGoodEvidenceSource(
    formatTimestamp(card.recentGoodRow.measured_at),
    card.latestRow ? formatTimestamp(card.latestRow.measured_at) : null,
    card.latestPackageMeasuredAt ? formatTimestamp(card.latestPackageMeasuredAt) : null,
  )
  return `${formatMeasurementValue(card.recentGoodRow)}. ${sourceDescription}`
}

const formatRawAdcValue = (value: number): string =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${
    value === 1 ? 'count' : 'counts'
  }`

const formatTrendLabel = (
  direction: HostedGen2TrendDirection,
  label: string,
): string => {
  const symbol = TREND_DIRECTION_SYMBOLS[direction]
  return symbol ? `${symbol} ${label}` : label
}

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) return 'Not available'
  const parsedValue = new Date(value)
  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : value
}

const formatNullableBoolean = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) return 'Not available'
  return value ? 'Yes' : 'No'
}

const formatNullableText = (value: string | null | undefined): string =>
  value?.trim() ? value : 'Not available'

const formatSvgNumber = (value: number): string =>
  value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false,
  })

export default HostedGen2Measurements
