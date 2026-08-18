import type { CSSProperties } from 'react'
import {
  describeLastGoodEvidenceSource,
  resolveCommissionedCardEvidence,
} from '../commissionedCardEvidence'
import {
  evaluateCommissionedEvidencePolicy,
  type CommissionedEvidencePolicy,
} from '../commissionedEvidencePolicy'
import {
  formatHostedGen2CardMeasurementValue,
  getHostedGen2EnvironmentalPresentation,
  getHostedGen2EnvironmentalScale,
  getHostedGen2CardPillLabel,
  getRelativeMoisturePresentation,
  getReservoirPresentation,
  type HostedGen2EnvironmentalTone,
} from '../hostedGen2EnvironmentalPresentation'
import {
  evaluateMeasurementPresentationEligibility,
  type MeasurementPresentationEligibility,
} from '../measurementPresentationEligibility'
import {
  HOSTED_GEN2_CARD_CATALOG,
  HOSTED_GEN2_ELEMENT_SECTIONS,
  PRACTICAL_DRY_RAW,
  WET_DRAINED_INDEX,
  WET_DRAINED_RAW,
  calculateGardenerMoistureIndex,
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
  supportEvidencePolicy?: boolean
  deviceReportingActive?: boolean
  showSupportEngineering?: boolean
}

type CardTone = HostedGen2EnvironmentalTone
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
  evidencePolicy: CommissionedEvidencePolicy | null
  conditionLabel: string | null
  latestEligibility: MeasurementPresentationEligibility | null
}

const APPROVED_QUALITY_VALUES = new Set(['good', 'diagnostic', 'ok', 'okay'])
const MOISTURE_CARD_KEYS = new Set(['moisture-m01', 'moisture-m02', 'moisture-m03'])
const RESERVOIR_CARD_KEY = 'reservoir-water'

const getEligibilityDetail = (
  result: MeasurementPresentationEligibility | null,
): string | null => {
  if (!result || result.presentationEligible) return null
  if (result.classification === 'outside-product-plausibility-range') {
    return 'Latest reading outside the approved product plausibility range'
  }
  if (result.classification === 'outside-provider-measurement-envelope') {
    return 'Latest reading outside the provider measurement envelope'
  }
  if (result.classification === 'invalid-discrete-value') {
    return 'Latest reading is not a recognized product value'
  }
  return 'Latest reading is not eligible for ordinary presentation'
}

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
  supportEvidencePolicy = false,
  deviceReportingActive = false,
  showSupportEngineering = true,
}: HostedGen2MeasurementsProps) => {
  // Package selection is chronological and preserves the source timestamp string.
  const latestPackage = getLatestPackage(rows)
  const hasRetainedRows = rows.length > 0
  const isRefreshing = isLoading && hasRetainedRows
  const transportState: TransportState =
    isLoading && !hasRetainedRows ? 'loading' : error && !hasRetainedRows ? 'error' : null
  const builtCards = cardDescriptors.map((descriptor) =>
    buildCatalogCardModel({
      descriptor,
      rows,
      latestPackage,
      transportState,
      successfulEmpty: !isLoading && !error && rows.length === 0,
      supportEvidencePolicy,
      deviceReportingActive,
    }),
  )
  const cards = supportEvidencePolicy && error
    ? builtCards.map((card) => ({
        ...card,
        pillLabel: 'Dashboard data unavailable',
        tone: card.displayRow ? card.tone : 'neutral' as CardTone,
        evidencePolicy: card.evidencePolicy
          ? {
              ...card.evidencePolicy,
              label: 'Dashboard data unavailable',
              detail: 'The dashboard could not confirm newer evidence.',
              severity: 'neutral' as const,
            }
          : null,
      }))
    : builtCards

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
                  <MeasurementCard
                    card={card}
                    key={card.descriptor.key}
                    showSupportEngineering={showSupportEngineering}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

const MeasurementCard = ({
  card,
  showSupportEngineering,
}: {
  card: HostedGen2CatalogCardModel
  showSupportEngineering: boolean
}) => {
  const trendSummary =
    card.trendRow && card.trendRows.length > 0
      ? getHostedGen2TrendSummary(card.trendRow, card.trendRows)
      : null
  const evidenceIsCurrent = card.evidencePolicy
    ? card.evidencePolicy.reason === 'current'
    : card.state === 'Current' ||
      card.reservoirState === 'Water Detected' ||
      card.reservoirState === 'Refill Reservoir'
  const visiblePillLabel = getHostedGen2CardPillLabel({
    conditionLabel: card.conditionLabel,
    evidenceLabel: card.pillLabel,
    evidenceIsCurrent,
  })

  return (
    <article className={`hosted-gen2-measurements-card is-${card.tone}`}>
      <div className="hosted-gen2-measurements-card-main">
        <h3>{card.descriptor.label}</h3>
        {visiblePillLabel ? (
          <span className={[
            'hosted-gen2-measurements-status-pill',
            card.evidencePolicy && !evidenceIsCurrent
              ? `is-evidence-${card.evidencePolicy.severity}`
              : '',
          ].filter(Boolean).join(' ')}>{visiblePillLabel}</span>
        ) : null}
      </div>
      <p className="hosted-gen2-measurements-value">{card.primaryValue}</p>
      {card.evidencePolicy?.detail ? (
        <p className="hosted-gen2-measurements-evidence-reason">{card.evidencePolicy.detail}</p>
      ) : null}
      {card.evidencePolicy && card.displayRow && card.evidencePolicy.reason !== 'current' ? (
        <p className="hosted-gen2-measurements-evidence-reason">
          Last good: {formatTimestamp(card.displayRow.measured_at)} · {formatEvidenceAge(card.evidencePolicy.lastGoodAgeMs)} old
        </p>
      ) : null}
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

      {card.transportState !== 'loading' ? (
        <div className="hosted-gen2-measurements-card-footer">
          <MeasurementDetails card={card} showSupportEngineering={showSupportEngineering} />
          <ConditionScalePill card={card} />
        </div>
      ) : null}
    </article>
  )
}

const ConditionScalePill = ({ card }: { card: HostedGen2CatalogCardModel }) => {
  const scaleMeasurementName = card.moistureIndex !== null
    ? 'moisture_index'
    : card.descriptor.canonicalMeasurementName
  const scaleValue = card.moistureIndex ?? card.displayRow?.measurement_value ?? null
  const scale = getHostedGen2EnvironmentalScale(scaleMeasurementName, scaleValue)
  const currentDescription = card.conditionLabel
    ? `Current condition: ${card.conditionLabel}`
    : 'Current condition unavailable'
  const accessibleLabel = `${scale.label}. ${currentDescription}.`
  const style = scale.positionPercent === null
    ? undefined
    : { '--condition-scale-position': `${scale.positionPercent}%` } as CSSProperties

  return (
    <span
      aria-label={accessibleLabel}
      className={`hosted-gen2-measurements-scale-pill is-${scale.key}`}
      role="img"
      style={style}
      title={accessibleLabel}
    >
      {scale.positionPercent === null ? null : (
        <span aria-hidden="true" className="hosted-gen2-measurements-scale-marker" />
      )}
    </span>
  )
}

const MeasurementDetails = ({
  card,
  showSupportEngineering,
}: {
  card: HostedGen2CatalogCardModel
  showSupportEngineering: boolean
}) => {
  const row = card.latestRow

  return (
    <details className="hosted-gen2-measurements-details">
      <summary>Sensor details</summary>
      <dl className="hosted-gen2-measurements-status">
        <dt>State</dt>
        <dd>{card.evidencePolicy?.label ?? card.reservoirState ?? card.state ?? 'Reading Unavailable'}</dd>

        {showSupportEngineering ? <><dt>Expected sensor key</dt><dd>{card.descriptor.sensorKey}</dd></> : null}

        {showSupportEngineering && card.descriptor.sensorFamily ? <><dt>Sensor family</dt><dd>{card.descriptor.sensorFamily}</dd></> : null}
        {showSupportEngineering && card.descriptor.logicalChannel ? <><dt>Logical channel</dt><dd>{card.descriptor.logicalChannel}</dd></> : null}

        {showSupportEngineering && card.descriptor.physicalSensorId ? (
          <>
            <dt>Expected physical sensor ID</dt>
            <dd>{card.descriptor.physicalSensorId}</dd>
          </>
        ) : null}

        {showSupportEngineering ? <><dt>Expected measurement</dt><dd>{card.descriptor.canonicalMeasurementName}</dd></> : null}

        <dt>Latest reading time</dt>
        <dd>{formatTimestamp(card.latestPackageMeasuredAt)}</dd>

        {showSupportEngineering && card.evidencePolicy ? (
          <>
            <dt>Latest-package presence</dt>
            <dd>{card.latestRow
              ? card.evidencePolicy.reason === 'omitted' ? 'No' : 'Yes'
              : 'No matching evidence'}</dd>
            <dt>Evidence health</dt>
            <dd>{card.evidencePolicy.label}</dd>
            <dt>Last-good age</dt>
            <dd>{formatEvidenceAge(card.evidencePolicy.lastGoodAgeMs)}</dd>
            <dt>Consecutive invalid updates</dt>
            <dd>{formatBoundedCount(card.evidencePolicy.invalidCount)}</dd>
            <dt>Consecutive omissions</dt>
            <dd>{formatBoundedCount(card.evidencePolicy.omissionCount)}</dd>
            {card.latestEligibility ? <>
              <dt>Presentation eligibility</dt>
              <dd>{card.latestEligibility.classification}</dd>
              <dt>Eligibility authority</dt>
              <dd>{card.latestEligibility.authority}</dd>
              <dt>Eligibility diagnostic</dt>
              <dd>{card.latestEligibility.diagnosticCode}</dd>
              {card.latestEligibility.concerns.length > 0 ? <>
                <dt>Measurement concern</dt>
                <dd>{card.latestEligibility.concerns.join(', ')}</dd>
              </> : null}
            </> : null}
          </>
        ) : null}

        {card.displayRow ? (
          <>
            <dt>Display source</dt>
            <dd>{formatDisplaySource(card)}</dd>
            <dt>Displayed measured at</dt>
            <dd>{formatTimestamp(card.displayRow.measured_at)}</dd>
            <dt>Displayed evidence stored at</dt>
            <dd>{formatTimestamp(card.displayRow.batch_created_at)}</dd>
          </>
        ) : null}

        {card.recentGoodRow && row ? (
          <>
            <dt>Recent good evidence</dt>
            <dd>{formatLastGoodEvidence(card)}</dd>
          </>
        ) : null}

        {showSupportEngineering && card.rawAdc !== null && card.displayRow ? (
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

        {showSupportEngineering && row ? (
          <>
            <dt>Latest row measured at</dt>
            <dd>{formatTimestamp(row.measured_at)}</dd>
            <dt>Latest row stored at</dt>
            <dd>{formatTimestamp(row.batch_created_at)}</dd>
            <dt>Latest row value</dt>
            <dd>{formatMeasurementValue(row)}</dd>
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
  supportEvidencePolicy,
  deviceReportingActive,
}: {
  descriptor: HostedGen2CardCatalogDescriptor
  rows: HostedGen2MeasurementRow[]
  latestPackage: LatestPackage | null
  transportState: TransportState
  successfulEmpty: boolean
  supportEvidencePolicy: boolean
  deviceReportingActive: boolean
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
      pillLabel: 'Presentation not supported',
    }
  }

  const commissionedEvidence = resolveCommissionedCardEvidence(descriptor, rows)
  const latestRow = commissionedEvidence.latestMatchingRow
  const latestEligibility = latestRow
    ? evaluateMeasurementPresentationEligibility(descriptor, latestRow)
    : null
  const latestPackageIsCurrent = commissionedEvidence.latestMatchingIsCurrent
  const shouldDisplayLastGood = Boolean(
    commissionedEvidence.lastPresentationEligibleRow &&
    (!commissionedEvidence.appearsInLatestPackage ||
      commissionedEvidence.lastPresentationEligibleRow !== latestRow),
  )
  const recentGoodRow = shouldDisplayLastGood
    ? commissionedEvidence.lastPresentationEligibleRow
    : null
  const requiresReview = Boolean(
    latestRow &&
      (latestRow.valid === false ||
        !APPROVED_QUALITY_VALUES.has(normalizeHostedGen2ComparisonText(latestRow.quality)) ||
        latestEligibility?.presentationEligible === false),
  )
  const evidencePolicy = supportEvidencePolicy && descriptor.isCommissioned
    ? evaluateCommissionedEvidencePolicy({
        descriptor,
        rows,
        latestMatchingRow: latestRow,
        lastGoodRow: commissionedEvidence.lastGoodRow,
        lastPresentationEligibleRow: commissionedEvidence.lastPresentationEligibleRow,
        latestPresentationEligible: latestEligibility?.presentationEligible ?? true,
        latestPresentationDetail: getEligibilityDetail(latestEligibility),
        appearsInLatestPackage: commissionedEvidence.appearsInLatestPackage,
        deviceReportingActive,
        derivedValueAvailable: !MOISTURE_CARD_KEYS.has(descriptor.key) ||
          Boolean(commissionedEvidence.lastPresentationEligibleRow),
      })
    : null

  if (descriptor.key === RESERVOIR_CARD_KEY) {
    if (successfulEmpty) {
      const emptyCard = buildStateOnlyCard(descriptor, null, 'No Readings Yet', 'neutral')
      return evidencePolicy
        ? {
            ...emptyCard,
            pillLabel: evidencePolicy.label,
            evidencePolicy,
            latestEligibility,
          }
        : emptyCard
    }

    return buildReservoirCard({
      descriptor,
      latestPackage,
      latestRow,
      recentGoodRow,
      latestPackageIsCurrent,
      evidencePolicy,
      latestEligibility,
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
  const displayRow = latestEligibility && !latestEligibility.presentationEligible && !recentGoodRow
    ? null
    : getDisplayRowForState(state, latestRow, recentGoodRow)

  return buildSensorCard({
    descriptor,
    rows,
    latestPackage,
    latestRow,
    displayRow,
    recentGoodRow,
    state,
    evidencePolicy,
    latestEligibility,
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
  evidencePolicy,
  latestEligibility,
}: {
  descriptor: HostedGen2CardCatalogDescriptor
  rows: HostedGen2MeasurementRow[]
  latestPackage: LatestPackage | null
  latestRow: HostedGen2MeasurementRow | null
  displayRow: HostedGen2MeasurementRow | null
  recentGoodRow: HostedGen2MeasurementRow | null
  state: HostedGen2SensorPresentationState
  evidencePolicy: CommissionedEvidencePolicy | null
  latestEligibility: MeasurementPresentationEligibility | null
}): HostedGen2CatalogCardModel => {
  const isMoisture = MOISTURE_CARD_KEYS.has(descriptor.key)
  const rawAdc = isMoisture && isFiniteRowValue(displayRow) ? displayRow.measurement_value : null
  const moistureIndex = rawAdc === null ? null : calculateGardenerMoistureIndex(rawAdc)
  const condition =
    (evidencePolicy?.conditionIsCurrent ?? state === 'Current') && moistureIndex !== null
      ? getRelativeMoisturePresentation(moistureIndex)
      : null
  const standardCondition = !isMoisture &&
    (evidencePolicy?.conditionIsCurrent ?? state === 'Current') && isFiniteRowValue(displayRow)
      ? getHostedGen2EnvironmentalPresentation(
          displayRow.measurement_name,
          displayRow.measurement_value,
        )
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
    pillLabel: evidencePolicy?.label ?? state,
    primaryValue:
      moistureIndex === null
        ? formatCardMeasurementValue(displayRow)
        : `${Math.round(moistureIndex).toLocaleString()} index`,
    tone: condition?.tone ?? standardCondition?.tone ?? 'neutral',
    trendRows: trend.rows,
    trendRow: trend.currentRow,
    rawAdc,
    moistureIndex,
    transportState: null,
    evidencePolicy,
    conditionLabel: condition?.label ?? standardCondition?.label ?? null,
    latestEligibility,
  }
}

const buildReservoirCard = ({
  descriptor,
  latestPackage,
  latestRow,
  recentGoodRow,
  latestPackageIsCurrent,
  evidencePolicy,
  latestEligibility,
}: {
  descriptor: HostedGen2CardCatalogDescriptor
  latestPackage: LatestPackage | null
  latestRow: HostedGen2MeasurementRow | null
  recentGoodRow: HostedGen2MeasurementRow | null
  latestPackageIsCurrent: boolean
  evidencePolicy: CommissionedEvidencePolicy | null
  latestEligibility: MeasurementPresentationEligibility | null
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
  const reservoirConditionIsCurrent = evidencePolicy?.conditionIsCurrent ??
    (reservoirState === 'Water Detected' || reservoirState === 'Refill Reservoir')
  const condition = reservoirConditionIsCurrent && isFiniteRowValue(displayRow)
    ? getReservoirPresentation(displayRow.measurement_value)
    : null

  return {
    descriptor,
    latestPackageMeasuredAt: latestPackage?.measuredAt ?? null,
    latestRow,
    displayRow,
    recentGoodRow,
    state: null,
    reservoirState,
    pillLabel: evidencePolicy?.label ?? (recentGoodRow ? 'Last Good Reading' : reservoirState),
    primaryValue: formatReservoirValue(displayRow),
    tone: condition?.tone ?? 'neutral',
    trendRows: [],
    trendRow: null,
    rawAdc: null,
    moistureIndex: null,
    transportState: null,
    evidencePolicy,
    conditionLabel: condition?.label ?? null,
    latestEligibility,
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
  tone: 'neutral',
  trendRows: [],
  trendRow: null,
  rawAdc: null,
  moistureIndex: null,
  transportState,
  evidencePolicy: null,
  conditionLabel: null,
  latestEligibility: null,
})

const buildUnavailableCard = (
  descriptor: HostedGen2CardCatalogDescriptor,
  latestPackage: LatestPackage | null,
): HostedGen2CatalogCardModel => ({
  ...buildStateOnlyCard(descriptor, latestPackage, 'Reading Unavailable', 'neutral'),
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
  evidencePolicy: null,
  conditionLabel: null,
  latestEligibility: null,
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
  const identityRows = rows
    .filter((row) => getHostedGen2CompoundIdentity(row) === identity)
    .filter((row) => evaluateMeasurementPresentationEligibility(descriptor, row).presentationEligible)

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

const formatCardMeasurementValue = (row: HostedGen2MeasurementRow | null): string => {
  if (!isFiniteRowValue(row)) return 'Not available'
  return formatHostedGen2CardMeasurementValue(row.measurement_value, row.measurement_unit)
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

const formatEvidenceAge = (ageMs: number | null): string => {
  if (ageMs === null || ageMs < 0) return 'Not available'
  const minutes = Math.floor(ageMs / 60_000)
  if (minutes < 60) return `${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} hours ${remainingMinutes} minutes` : `${hours} hours`
}

const formatBoundedCount = ({ count, isLowerBound }: { count: number; isLowerBound: boolean }): string =>
  isLowerBound ? `At least ${count}` : count.toLocaleString()

const formatSvgNumber = (value: number): string =>
  value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false,
  })

export default HostedGen2Measurements
