import type { CSSProperties } from 'react'
import type { DeviceStatusHealthStatus } from '../deviceStatusHealth'
import type { HostedGen2Health } from '../hostedGen2Health'
import './SensorHealthPanel.css'

type SensorHealthPanelProps = {
  health: HostedGen2Health
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

type StatusSummaryTone = 'good' | 'watch' | 'check' | 'neutral'

type StatusSummary = {
  tone: StatusSummaryTone
  label: string
  message: string
}

const statusStyles: Record<
  DeviceStatusHealthStatus,
  {
    background: string
    border: string
    color: string
    dot: string
    shadow: string
  }
> = {
  healthy: {
    background: '#f8fafc',
    border: '#16a34a',
    color: '#14532d',
    dot: '#16a34a',
    shadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
  },
  warning: {
    background: '#fefce8',
    border: '#ca8a04',
    color: '#713f12',
    dot: '#ca8a04',
    shadow: '0 10px 24px rgba(113, 63, 18, 0.18)',
  },
  'no-recent-data': {
    background: '#fef2f2',
    border: '#dc2626',
    color: '#7f1d1d',
    dot: '#dc2626',
    shadow: '0 10px 24px rgba(127, 29, 29, 0.2)',
  },
  'no-data': {
    background: '#fef2f2',
    border: '#dc2626',
    color: '#7f1d1d',
    dot: '#dc2626',
    shadow: '0 10px 24px rgba(127, 29, 29, 0.2)',
  },
}

const SensorHealthPanel = ({ health, isOpen, onOpenChange }: SensorHealthPanelProps) => {
  return (
    <HostedGen2HealthPanel
      health={health}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    />
  )
}
const HostedGen2HealthPanel = ({
  health,
  isOpen,
  onOpenChange,
}: {
  health: HostedGen2Health
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}) => {
  const styles = statusStyles[health.status]
  const hasHistoryGapOnly = health.attentionLevel === 'history-gap'
  const attentionMessages = hasHistoryGapOnly
    ? ['Some reading updates are missing from the selected window. The latest readings are current and usable.']
    : health.attentionItems.map((item) => item.message)
  const summaries: StatusSummary[] = [
    {
      tone: health.readingAge.tone,
      label: 'Reading Age',
      message: formatHostedReadingAge(health),
    },
    {
      tone: health.sensorAvailability.tone,
      label: 'Sensor Availability',
      message: `${health.sensorAvailability.reportedEntryCount} of ${health.sensorAvailability.expectedEntryCount} expected readings reported; ${health.sensorAvailability.representedPhysicalSensorCount} of ${health.sensorAvailability.expectedPhysicalSensorCount} physical sensors represented.`,
    },
    {
      tone: health.readingHistory.tone,
      label: 'Reading History',
      message: formatHostedReadingHistory(health),
    },
    {
      tone: health.latestReadingChecks.tone,
      label: 'Latest Reading Checks',
      message: formatHostedLatestReadingChecks(health),
    },
  ]
  const panelStyle = {
    '--sensor-health-background': styles.background,
    '--sensor-health-border': styles.border,
    '--sensor-health-color': styles.color,
    '--sensor-health-dot': styles.dot,
    '--sensor-health-shadow': styles.shadow,
  } as CSSProperties

  return (
    <div
      aria-label="Garden Reading Quality"
      className={`sensor-health-panel${isOpen ? ' is-open' : ''}`}
      style={panelStyle}
    >
      <button
        aria-controls="device-status-details"
        aria-expanded={isOpen ?? false}
        className={`sensor-health-summary sensor-health-summary-${health.status}`}
        onClick={() => onOpenChange?.(!isOpen)}
        type="button"
      >
        <span className="sensor-health-title">
          <span aria-hidden="true" className="sensor-health-dot" />
          Garden Reading Quality
        </span>
        {health.attentionItems.length > 0 ? (
          <span className="sensor-health-message">
            {hasHistoryGapOnly ? 'History Gap' : 'Needs Attention'}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="sensor-health-details" id="device-status-details">
          <div className="sensor-health-heading">
            <div>
              <h2>Garden Reading Quality</h2>
              <p>See how current, complete, and usable the reported garden readings are.</p>
            </div>
          </div>

          <div className="sensor-health-summary-grid">
            {summaries.map((summary) => (
              <article
                className={`sensor-health-summary-card is-${summary.tone}`}
                key={summary.label}
              >
                <h3>{summary.label}</h3>
                <p>{summary.message}</p>
              </article>
            ))}
          </div>

          {health.attentionItems.length > 0 ? (
            <section className="sensor-health-advanced">
              <h3>{hasHistoryGapOnly ? 'Worth Noting' : 'Needs Attention'}</h3>
              <ul>
                {attentionMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <details className="sensor-health-advanced">
            <summary>Advanced status evidence</summary>
            <dl className="sensor-health-list">
              <dt>Expected readings</dt>
              <dd>{health.sensorAvailability.expectedEntryCount}</dd>
              <dt>Expected physical sensors</dt>
              <dd>{health.sensorAvailability.expectedPhysicalSensorCount}</dd>
              <dt>Profile not installed</dt>
              <dd>{health.sensorAvailability.profileNotInstalledEntryCount}</dd>
              <dt>History coverage</dt>
              <dd>{formatNullablePercent(health.readingHistory.coveragePercent)}</dd>
              <dt>Latest reported reasons</dt>
              <dd>{formatHostedReasons(health.latestReadingChecks.reasons)}</dd>
            </dl>
          </details>
        </div>
      ) : null}
    </div>
  )
}

const formatHostedReadingAge = (health: HostedGen2Health): string => {
  if (!health.readingAge.hasTimestamp || health.readingAge.latestAgeMs === null) {
    return 'No report timestamp is available for this window.'
  }

  if (health.readingAge.latestAgeMs < 0) {
    return 'Latest report timestamp is later than the current dashboard time.'
  }

  const age = formatDuration(health.readingAge.latestAgeMs).replace(/ ago$/, '')
  return health.readingAge.isCurrent
    ? `Latest report received ${age.toLowerCase()} ago.`
    : `Latest report is ${age.toLowerCase()} ago and is not current.`
}

const formatHostedReadingHistory = (health: HostedGen2Health): string => {
  const history = health.readingHistory
  if (history.packageCount === 0) {
    return 'No report history is available for this device and window.'
  }

  if (history.expectedPackageCount === null) {
    return `${history.packageCount.toLocaleString()} reports are present. Coverage is not evaluated for this window.`
  }

  return `${history.packageCount.toLocaleString()} of ${Math.round(history.expectedPackageCount).toLocaleString()} expected reports are present. Largest gap: ${formatElapsedDuration(history.largestGapMs).toLowerCase()}.`
}

const formatHostedLatestReadingChecks = (health: HostedGen2Health): string => {
  const checks = health.latestReadingChecks
  if (
    checks.usableEntryCount === checks.expectedEntryCount &&
    checks.absentEntryCount === 0
  ) {
    return `${checks.expectedEntryCount} expected readings checked; all ${checks.expectedEntryCount} are usable.`
  }

  const facts = [
    `${checks.usableEntryCount} usable`,
    checks.invalidEntryCount > 0 ? `${checks.invalidEntryCount} invalid` : null,
    checks.qualityWarningEntryCount > 0
      ? `${checks.qualityWarningEntryCount} with quality metadata requiring review`
      : null,
    checks.missingValueEntryCount > 0
      ? `${checks.missingValueEntryCount} value${checks.missingValueEntryCount === 1 ? '' : 's'} unavailable`
      : null,
    checks.sensorNotDetectedEntryCount > 0
      ? `${checks.sensorNotDetectedEntryCount} with not-detected evidence`
      : null,
    checks.profileNotInstalledEntryCount > 0
      ? `${checks.profileNotInstalledEntryCount} marked not installed`
      : null,
    checks.absentEntryCount > 0 ? `${checks.absentEntryCount} not reported` : null,
  ].filter((fact): fact is string => Boolean(fact))

  return `${checks.expectedEntryCount} expected readings checked: ${facts.join(', ')}.`
}

const formatHostedReasons = (reasons: string[]): string =>
  reasons.length > 0 ? `Reported reasons: ${reasons.join(', ')}.` : 'No endpoint reasons were reported.'

const formatNullablePercent = (value: number | null): string =>
  value === null ? 'Not evaluated' : formatPercent(value)

const formatPercent = (value: number): string => `${Math.round(value)}%`

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null || durationMs < 0) {
    return 'Not available'
  }

  const totalMinutes = Math.round(durationMs / 60000)

  if (totalMinutes < 1) {
    return 'Less than 1 minute ago'
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min ago`
  }

  const totalHours = Math.round(totalMinutes / 60)

  if (totalHours < 48) {
    return `${totalHours} hr ago`
  }

  const totalDays = Math.round(totalHours / 24)
  return `${totalDays} days ago`
}

const formatElapsedDuration = (durationMs: number | null): string => {
  if (durationMs === null || durationMs < 0) {
    return 'Not available'
  }

  const totalMinutes = Math.round(durationMs / 60000)

  if (totalMinutes < 1) {
    return 'Less than 1 minute'
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const totalHours = Math.round(totalMinutes / 60)

  if (totalHours < 48) {
    return `${totalHours} hr`
  }

  const totalDays = Math.round(totalHours / 24)
  return `${totalDays} days`
}

export default SensorHealthPanel
