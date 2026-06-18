import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import {
  compareHostedGen2MeasurementNames,
  formatHostedGen2MeasurementLabel,
  getHostedGen2MeasurementDisplay,
  getHostedGen2MeasurementStatus,
  type HostedGen2MeasurementStatus,
} from '../hostedGen2Display'
import {
  getHostedGen2TrendSummary,
  type HostedGen2TrendDirection,
  type HostedGen2SparklinePoint,
} from '../hostedGen2TrendSummary'
import {
  getHostedMeasurementTrust,
  type HostedMeasurementTrustResult,
} from '../hostedMeasurementTrust'
import {
  getHostedGen2MeasurementDisplayModels,
  type HostedGen2MeasurementDisplayModel,
} from '../hostedGen2RecentValue'
import './HostedGen2Measurements.css'

type HostedGen2MeasurementsProps = {
  rows: HostedGen2MeasurementRow[]
  isLoading: boolean
  error: string | null
  fallbackDeviceLabel: string
  className?: string
}

type MeasurementGroupKey = 'soil' | 'light' | 'air'

type MeasurementDetailFact = {
  label: string
  value: string
}

type MeasurementCardDescriptor = {
  key: string
  group: MeasurementGroupKey
  label: string
  model: HostedGen2MeasurementDisplayModel
  rows: HostedGen2MeasurementRow[]
  displayRowOverride?: HostedGen2MeasurementRow | null
  valueOverride?: string
  statusOverride?: HostedGen2MeasurementStatus
  trustOverride?: HostedMeasurementTrustResult
  detailFacts?: MeasurementDetailFact[]
  supportingFact?: string
}

const HostedGen2Measurements = ({
  rows,
  isLoading,
  error,
  className = '',
}: HostedGen2MeasurementsProps) => {
  const sortedRows = [...rows].sort(compareRowsNewestFirst)
  const hasUsableRows = rows.length > 0
  const isBlockingLoad = isLoading && !hasUsableRows
  const isRefreshing = isLoading && hasUsableRows
  const measurementDisplayModels = getHostedGen2MeasurementDisplayModels(sortedRows)
    .sort(compareDisplayModelsForDisplay)
  const groupedCards = getMeasurementCardGroups(measurementDisplayModels, rows)
  const latestMeasuredAt = sortedRows[0]?.measured_at ?? null

  return (
    <section
      className={['hosted-gen2-measurements', className].filter(Boolean).join(' ')}
      data-guide-target="readings"
      aria-label="Live Measurements"
    >
      <div className="hosted-gen2-measurements-header">
        <div>
          <h2>Live Measurements</h2>
          <p className="hosted-gen2-measurements-updated">
            Last Reading {formatTimestamp(latestMeasuredAt)}
          </p>
        </div>
        <span className="hosted-gen2-measurements-refresh">
          {isRefreshing ? 'Refreshing' : 'Live'}
        </span>
      </div>

      {error ? <p className="hosted-gen2-measurements-error">{error}</p> : null}

      {isBlockingLoad ? (
        <p className="hosted-gen2-measurements-note">Loading Gen2 measurements...</p>
      ) : null}

      {!isBlockingLoad && rows.length === 0 ? (
        <p className="hosted-gen2-measurements-note">
          No Gen2 measurements found for this device/window yet.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="hosted-gen2-measurements-groups">
            {groupedCards.map((group) => (
              <section
                className={[
                  'hosted-gen2-measurements-group',
                  `is-${group.key}`,
                ].join(' ')}
                key={group.key}
              >
                <h3 className="hosted-gen2-measurements-group-title">{group.label}</h3>
                <div className="hosted-gen2-measurements-card-grid">
                  {group.cards.map((card) => (
                    <MeasurementCard
                      key={card.key}
                      label={card.label}
                      model={card.model}
                      rows={card.rows}
                      displayRowOverride={card.displayRowOverride}
                      valueOverride={card.valueOverride}
                      statusOverride={card.statusOverride}
                      trustOverride={card.trustOverride}
                      detailFacts={card.detailFacts}
                      supportingFact={card.supportingFact}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

const MeasurementCard = ({
  label,
  model,
  rows,
  displayRowOverride,
  valueOverride,
  statusOverride,
  trustOverride,
  detailFacts = [],
  supportingFact,
}: {
  label: string
  model: HostedGen2MeasurementDisplayModel
  rows: HostedGen2MeasurementRow[]
  displayRowOverride?: HostedGen2MeasurementRow | null
  valueOverride?: string
  statusOverride?: HostedGen2MeasurementStatus
  trustOverride?: HostedMeasurementTrustResult
  detailFacts?: MeasurementDetailFact[]
  supportingFact?: string
}) => {
  const latestRow = model.latestRow
  const displayRow = displayRowOverride ?? model.displayRow ?? undefined
  const display = getHostedGen2MeasurementDisplay(
    displayRow?.measurement_name ?? latestRow.measurement_name,
  )
  const status =
    statusOverride ??
    (model.mode === 'unavailable'
      ? { level: 'check' as const, label: 'Check Sensor', reason: 'Reading unavailable' }
      : getHostedGen2MeasurementStatus({
          measurementName: displayRow?.measurement_name,
          measurementValue: displayRow?.measurement_value,
          valid: displayRow?.valid,
        }))
  const baseTrust = getHostedMeasurementTrust({
    row: displayRow,
    rows,
    fallbackStatus: status,
  })
  const trust =
    trustOverride ??
    (model.mode === 'recent-good'
      ? {
          level: 'watch' as const,
          label: model.labelOverride ?? 'Using Recent Value',
          headlineReason: model.message ?? '',
          detailReason: model.detailReason ?? '',
          trustFlags: model.trustFlags,
        }
      : model.mode === 'unavailable'
        ? {
            level: 'failed' as const,
            label: model.labelOverride ?? 'Check Sensor',
            headlineReason: model.message ?? '',
            detailReason: model.detailReason ?? '',
            trustFlags: model.trustFlags,
          }
        : baseTrust)
  const trendSummary = getHostedGen2TrendSummary(displayRow, rows)
  const shouldShowHeadlineReason = shouldShowTrustHeadlineReason(trust.headlineReason)

  return (
    <article
      className={[
        'hosted-gen2-measurements-card',
        `is-${trust.level}`,
        display.diagnostic ? 'is-diagnostic' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="hosted-gen2-measurements-card-main">
        <h3>{label}</h3>
        <span className="hosted-gen2-measurements-status-pill">{trust.label}</span>
      </div>
      <p className="hosted-gen2-measurements-value">
        {valueOverride ?? formatMeasurementValue(displayRow)}
      </p>
      {supportingFact ? (
        <p className="hosted-gen2-measurements-supporting-fact">{supportingFact}</p>
      ) : null}
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
      {shouldShowHeadlineReason ? (
        <p className="hosted-gen2-measurements-status-reason">{trust.headlineReason}</p>
      ) : null}
      <details className="hosted-gen2-measurements-details">
        <summary>Sensor details</summary>
        <dl className="hosted-gen2-measurements-status">
          {!shouldShowHeadlineReason && trust.headlineReason ? (
            <>
              <dt>Status note</dt>
              <dd>{trust.headlineReason}</dd>
            </>
          ) : null}

          <dt>Display trust</dt>
          <dd>{trust.detailReason}</dd>

          <dt>Trust flags</dt>
          <dd>{formatTrustFlags(trust.trustFlags)}</dd>

          <dt>Display source</dt>
          <dd>{formatDisplaySource(model.mode)}</dd>

          <dt>Displayed measured at</dt>
          <dd>{formatTimestamp(displayRow?.measured_at)}</dd>

          {detailFacts.map((fact) => (
            <MeasurementDetailFactRow fact={fact} key={fact.label} />
          ))}

          {model.recentGoodRow ? (
            <>
              <dt>Recent good evidence</dt>
              <dd>{formatRecentGoodEvidence(model.latestRow, model.recentGoodRow)}</dd>
            </>
          ) : null}

          <dt>Latest measured at</dt>
          <dd>{formatTimestamp(latestRow.measured_at)}</dd>

          <dt>Sensor key</dt>
          <dd>{formatNullableText(latestRow.sensor_key)}</dd>

          <dt>Sensor type</dt>
          <dd>{formatNullableText(latestRow.sensor_type)}</dd>

          <dt>Latest valid</dt>
          <dd>{formatNullableBoolean(latestRow.valid)}</dd>

          <dt>Latest quality</dt>
          <dd>{formatNullableText(latestRow.quality)}</dd>

          <dt>Latest reason</dt>
          <dd>{formatNullableText(latestRow.reason)}</dd>

          <dt>Latest control eligible</dt>
          <dd>{formatControlEligible(latestRow.control_eligible)}</dd>

          {model.mode === 'recent-good' ? (
            <>
              <dt>Displayed control eligible</dt>
              <dd>{formatControlEligible(displayRow?.control_eligible)}</dd>
            </>
          ) : null}
        </dl>
      </details>
    </article>
  )
}

const SPARKLINE_WIDTH = 64
const SPARKLINE_HEIGHT = 24
const SPARKLINE_PADDING = 3
const ROUTINE_TRUST_PASS_REASON = 'Reading is displayable and passed dashboard quality checks.'
const PRACTICAL_DRY_RAW = 14820
const WET_DRAINED_RAW = 11230
const WET_DRAINED_INDEX = 90

const HIDDEN_MAIN_CARD_SENSOR_KEYS = new Set([
  'veml6030_light',
  'soil_moisture_analog',
  'sen0308_m02',
  'sen0308_m03',
  'sen0308_m04',
  'sen0562_l02',
  'sen0562_l03',
])

const UNINSTALLED_QUALITY_VALUES = new Set([
  'disabled',
  'missing',
  'not_installed',
  'not installed',
  'unavailable',
])

const MEASUREMENT_GROUPS: Array<{ key: MeasurementGroupKey; label: string }> = [
  { key: 'soil', label: 'Soil Conditions' },
  { key: 'light', label: 'Light Conditions' },
  { key: 'air', label: 'Air Conditions' },
]

const TREND_DIRECTION_SYMBOLS: Partial<Record<HostedGen2TrendDirection, string>> = {
  rising: '↗',
  falling: '↘',
  stable: '→',
}

const MeasurementDetailFactRow = ({ fact }: { fact: MeasurementDetailFact }) => (
  <>
    <dt>{fact.label}</dt>
    <dd>{fact.value}</dd>
  </>
)

const TrendSparkline = ({ points }: { points: HostedGen2SparklinePoint[] }) => {
  const polylinePoints = formatSparklinePolyline(points)

  return (
    <svg
      className="hosted-gen2-measurements-sparkline"
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      aria-hidden="true"
      focusable="false"
    >
      <polyline points={polylinePoints} />
    </svg>
  )
}

const getMeasurementCardGroups = (
  models: HostedGen2MeasurementDisplayModel[],
  rows: HostedGen2MeasurementRow[],
) => {
  const cards = [
    getMoistureIndexCard(models, rows),
    ...models
      .filter((model) => !shouldHideMainMeasurementCard(model))
      .map((model): MeasurementCardDescriptor | null => {
        const group = getMeasurementGroup(model.latestRow)

        if (!group) {
          return null
        }

        return {
          key: getMeasurementCardKey(model.latestRow),
          group,
          label: formatHostedGen2MeasurementLabel(model.latestRow.measurement_name),
          model,
          rows,
        }
      }),
  ].filter((card): card is MeasurementCardDescriptor => Boolean(card))

  return MEASUREMENT_GROUPS.map((group) => ({
    ...group,
    cards: cards
      .filter((card) => card.group === group.key)
      .sort(compareMeasurementCardsForDisplay),
  })).filter((group) => group.cards.length > 0)
}

const getMoistureIndexCard = (
  models: HostedGen2MeasurementDisplayModel[],
  rows: HostedGen2MeasurementRow[],
): MeasurementCardDescriptor | null => {
  const sourceModel = models.find((model) => isPrimarySen0308RawAdcRow(model.latestRow))

  if (!sourceModel) {
    return null
  }

  const rawDisplayRow = sourceModel.displayRow

  if (!rawDisplayRow || !isFiniteNumber(rawDisplayRow.measurement_value)) {
    return null
  }

  const moistureIndex = calculateGardenerMoistureIndex(rawDisplayRow.measurement_value)
  const displayRow = buildMoistureIndexDisplayRow(rawDisplayRow, moistureIndex)
  const trendRows = rows
    .filter(isPrimarySen0308RawAdcRow)
    .map((row) =>
      isFiniteNumber(row.measurement_value)
        ? buildMoistureIndexDisplayRow(row, calculateGardenerMoistureIndex(row.measurement_value))
        : buildMoistureIndexDisplayRow(row, null),
    )
  const status = getGardenerMoistureStatus(moistureIndex)

  return {
    key: 'soil:gardener-moisture-index:sen0308_m01',
    group: 'soil',
    label: 'Moisture Index',
    model: sourceModel,
    rows: trendRows,
    displayRowOverride: displayRow,
    valueOverride: `${Math.round(moistureIndex).toLocaleString()} index`,
    statusOverride: status,
    trustOverride: getMoistureIndexTrust(status, sourceModel),
    supportingFact: `Raw ADC ${formatRawAdcValue(rawDisplayRow.measurement_value)}`,
    detailFacts: [
      {
        label: 'Raw ADC evidence',
        value: `${formatRawAdcValue(rawDisplayRow.measurement_value)} from sen0308_m01`,
      },
      {
        label: 'Moisture formula',
        value: `${WET_DRAINED_INDEX} * (${PRACTICAL_DRY_RAW} - raw_adc) / (${PRACTICAL_DRY_RAW} - ${WET_DRAINED_RAW})`,
      },
      {
        label: 'Unrounded index',
        value: `${formatIndexValue(moistureIndex)} index`,
      },
    ],
  }
}

const shouldHideMainMeasurementCard = (model: HostedGen2MeasurementDisplayModel): boolean => {
  const latestRow = model.latestRow
  const sensorKey = normalizeText(latestRow.sensor_key)
  const measurementName = normalizeText(latestRow.measurement_name)

  if (HIDDEN_MAIN_CARD_SENSOR_KEYS.has(sensorKey)) {
    return true
  }

  if (normalizeText(latestRow.reason) === 'profile_not_installed') {
    return true
  }

  if (UNINSTALLED_QUALITY_VALUES.has(normalizeText(latestRow.quality))) {
    return true
  }

  return measurementName === 'moisture_index' || measurementName === 'raw_adc'
}

const getMeasurementGroup = (
  row: HostedGen2MeasurementRow,
): MeasurementGroupKey | null => {
  const measurementName = normalizeText(row.measurement_name)
  const sensorType = normalizeText(row.sensor_type)

  if (measurementName === 'ambient_light') {
    return 'light'
  }

  if (measurementName === 'temperature' && sensorType.includes('ds18b20')) {
    return 'soil'
  }

  if (
    measurementName === 'air_temperature' ||
    measurementName === 'relative_humidity' ||
    measurementName === 'barometric_pressure' ||
    measurementName === 'temperature'
  ) {
    return 'air'
  }

  return null
}

const compareMeasurementCardsForDisplay = (
  left: MeasurementCardDescriptor,
  right: MeasurementCardDescriptor,
): number => {
  const rankDiff = getMeasurementCardRank(left) - getMeasurementCardRank(right)

  if (rankDiff !== 0) {
    return rankDiff
  }

  return left.label.localeCompare(right.label)
}

const getMeasurementCardRank = (card: MeasurementCardDescriptor): number => {
  const measurementName = normalizeText(
    card.displayRowOverride?.measurement_name ?? card.model.latestRow.measurement_name,
  )

  switch (measurementName) {
    case 'moisture_index':
      return 0
    case 'temperature':
      return 1
    case 'ambient_light':
      return 0
    case 'air_temperature':
      return 0
    case 'relative_humidity':
      return 1
    case 'barometric_pressure':
      return 2
    default:
      return 99
  }
}

const buildMoistureIndexDisplayRow = (
  row: HostedGen2MeasurementRow,
  moistureIndex: number | null,
): HostedGen2MeasurementRow => ({
  ...row,
  measurement_name: 'moisture_index',
  measurement_value: moistureIndex,
  measurement_unit: 'index',
})

const calculateGardenerMoistureIndex = (currentRaw: number): number =>
  (WET_DRAINED_INDEX * (PRACTICAL_DRY_RAW - currentRaw)) /
  (PRACTICAL_DRY_RAW - WET_DRAINED_RAW)

const getGardenerMoistureStatus = (value: number): HostedGen2MeasurementStatus => {
  if (value < 0) {
    return {
      level: 'check',
      label: 'Check Sensor',
      reason: 'Reading is outside the practical soil range.',
    }
  }

  if (value <= 20) {
    return { level: 'check', label: 'Too Dry', reason: 'Soil is already too dry.' }
  }

  if (value <= 40) {
    return { level: 'watch', label: 'Dry', reason: 'Soil is on the dry side.' }
  }

  if (value <= 70) {
    return { level: 'good', label: 'Moist' }
  }

  if (value <= 90) {
    return { level: 'good', label: 'Well-watered' }
  }

  if (value <= 105) {
    return {
      level: 'watch',
      label: 'Very Wet',
      reason: 'Soil is wetter than the normal target range.',
    }
  }

  return { level: 'check', label: 'Saturated', reason: 'Saturated or water-like evidence.' }
}

const getMoistureIndexTrust = (
  status: HostedGen2MeasurementStatus,
  model: HostedGen2MeasurementDisplayModel,
): HostedMeasurementTrustResult => {
  const isRoutine = status.level === 'good' && model.mode === 'latest'

  return {
    level: status.level,
    label: status.label,
    headlineReason:
      model.mode === 'recent-good'
        ? 'Fresh SEN0308 read failed; recent raw ADC is converted for display.'
        : status.reason ?? (isRoutine ? ROUTINE_TRUST_PASS_REASON : 'Moisture index needs review.'),
    detailReason:
      model.mode === 'recent-good'
        ? 'Latest raw ADC metadata is preserved below; the displayed moisture index comes from recent good SEN0308 raw ADC evidence.'
        : 'Display-only moisture index computed from SEN0308 raw ADC evidence.',
    trustFlags:
      model.mode === 'recent-good'
        ? [...model.trustFlags, 'display-only-moisture-index']
        : ['display-only-moisture-index'],
  }
}

const isPrimarySen0308RawAdcRow = (row: HostedGen2MeasurementRow): boolean =>
  normalizeText(row.sensor_key) === 'sen0308_m01' &&
  normalizeText(row.measurement_name) === 'raw_adc'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formatRawAdcValue = (value: number): string =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${
    value === 1 ? 'count' : 'counts'
  }`

const formatIndexValue = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 1 })

const compareRowsNewestFirst = (
  left: HostedGen2MeasurementRow,
  right: HostedGen2MeasurementRow,
) => {
  const measuredAtDiff =
    getTimestampMs(right.measured_at) - getTimestampMs(left.measured_at)

  if (measuredAtDiff !== 0) {
    return measuredAtDiff
  }

  return left.record_index - right.record_index
}

const compareRowsForDisplay = (
  left: HostedGen2MeasurementRow,
  right: HostedGen2MeasurementRow,
) => {
  const measurementNameDiff = compareHostedGen2MeasurementNames(
    left.measurement_name,
    right.measurement_name,
  )

  if (measurementNameDiff !== 0) {
    return measurementNameDiff
  }

  return left.record_index - right.record_index
}

const compareDisplayModelsForDisplay = (
  left: HostedGen2MeasurementDisplayModel,
  right: HostedGen2MeasurementDisplayModel,
) => compareRowsForDisplay(left.latestRow, right.latestRow)

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available'
  }

  const parsedValue = new Date(value)

  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : value
}

const getTimestampMs = (value: string): number => {
  const timestampMs = new Date(value).getTime()
  return Number.isFinite(timestampMs) ? timestampMs : 0
}

const formatMeasurementValue = (
  row: HostedGen2MeasurementRow | undefined,
): string => {
  if (!row || row.measurement_value === null || !Number.isFinite(row.measurement_value)) {
    return 'Not available'
  }

  return `${row.measurement_value.toLocaleString()} ${row.measurement_unit ?? ''}`.trim()
}

const formatNullableBoolean = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  return value ? 'Yes' : 'No'
}

const formatNullableText = (value: string | null | undefined): string =>
  value?.trim() ? value : 'Not available'

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? ''

const formatControlEligible = (value: boolean | null | undefined): string =>
  `${formatNullableBoolean(value)} - garden unit evidence only`

const formatTrustFlags = (values: string[]): string =>
  values.length > 0 ? values.join(', ') : 'None'

const formatDisplaySource = (mode: HostedGen2MeasurementDisplayModel['mode']): string => {
  if (mode === 'recent-good') {
    return 'Using recent good value; latest read evidence remains below.'
  }

  if (mode === 'unavailable') {
    return 'Latest read is not displayable and no recent good value was found.'
  }

  return 'Latest garden reading.'
}

const formatRecentGoodEvidence = (
  latestRow: HostedGen2MeasurementRow,
  recentGoodRow: HostedGen2MeasurementRow,
): string => {
  const value = formatMeasurementValue(recentGoodRow)
  const measuredAt = formatTimestamp(recentGoodRow.measured_at)
  const ageFromLatest = formatDurationBetween(recentGoodRow.measured_at, latestRow.measured_at)

  return `${value} at ${measuredAt}; ${ageFromLatest} before latest read.`
}

const formatDurationBetween = (startValue: string, endValue: string): string => {
  const startMs = new Date(startValue).getTime()
  const endMs = new Date(endValue).getTime()

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return 'age unavailable'
  }

  const totalSeconds = Math.round((endMs - startMs) / 1000)

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`
  }

  const totalMinutes = Math.round(totalSeconds / 60)

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const totalHours = Math.round(totalMinutes / 60)
  return `${totalHours} hr`
}

const shouldShowTrustHeadlineReason = (value: string): boolean =>
  value !== ROUTINE_TRUST_PASS_REASON

const formatTrendLabel = (
  direction: HostedGen2TrendDirection,
  label: string,
): string => {
  const symbol = TREND_DIRECTION_SYMBOLS[direction]

  return symbol ? `${symbol} ${label}` : label
}

const formatSparklinePolyline = (points: HostedGen2SparklinePoint[]): string => {
  const innerWidth = SPARKLINE_WIDTH - SPARKLINE_PADDING * 2
  const innerHeight = SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2

  return points
    .map((point) => {
      const x = SPARKLINE_PADDING + point.x * innerWidth
      const y = SPARKLINE_PADDING + point.y * innerHeight

      return `${formatSvgNumber(x)},${formatSvgNumber(y)}`
    })
    .join(' ')
}

const formatSvgNumber = (value: number): string =>
  value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false,
  })

const getMeasurementCardKey = (row: HostedGen2MeasurementRow): string =>
  [
    row.measurement_name ?? 'measurement',
    row.sensor_key ?? 'sensor',
    row.sensor_type ?? 'type',
  ].join(':')

export default HostedGen2Measurements
