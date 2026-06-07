import type { CSSProperties } from 'react'
import type { DeviceStatusHealth, DeviceStatusHealthStatus } from '../deviceStatusHealth'
import './SensorHealthPanel.css'

type SensorHealthPanelProps = {
  health: DeviceStatusHealth<unknown>
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
  const styles = statusStyles[health.status]
  const statusMessage = getStatusMessage(health.status)
  const statusTone = getStatusTone(health.status)
  const statusSummaries = getStatusSummaries(health)
  const rowsInWindowLabel = health.rowsInWindowLabel ?? 'Rows in window'
  const expectedRowsLabel = health.expectedRowsLabel ?? 'Expected rows'
  const latestReadingsLabel = health.latestReadingsLabel ?? 'Latest readings'
  const wateringMarkersLabel = health.wateringMarkersLabel ?? 'Watering history markers'
  const panelStyle = {
    '--sensor-health-background': styles.background,
    '--sensor-health-border': styles.border,
    '--sensor-health-color': styles.color,
    '--sensor-health-dot': styles.dot,
    '--sensor-health-shadow': styles.shadow,
  } as CSSProperties

  return (
    <div
      aria-label="Device status"
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
          <span
            aria-hidden="true"
            className="sensor-health-dot"
          />
          {health.statusLabel}
        </span>

        {statusMessage ? (
          <span className="sensor-health-message">
            {statusMessage}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="sensor-health-details" id="device-status-details">
          <div className="sensor-health-heading">
            <div>
              <h2>Device Status</h2>
              <p>{getStatusSubtitle(health.status)}</p>
            </div>
            <span className={`sensor-health-overall is-${statusTone}`}>
              {getPanelStatusLabel(health.status)}
            </span>
          </div>

          <div className="sensor-health-summary-grid">
            {statusSummaries.map((summary) => (
              <article
                key={summary.label}
                className={`sensor-health-summary-card is-${summary.tone}`}
              >
                <h3>{summary.label}</h3>
                <p>{summary.message}</p>
              </article>
            ))}
          </div>

          <details className="sensor-health-advanced">
            <summary>Advanced status evidence</summary>
            <dl className="sensor-health-list">
              <dt>Last report</dt>
              <dd>{formatDuration(health.latestAgeMs)}</dd>

              <dt>{rowsInWindowLabel}</dt>
              <dd>{health.rowsInWindow}</dd>

              <dt>{expectedRowsLabel}</dt>
              <dd>{formatNullableNumber(health.expectedRows)}</dd>

              <dt>Coverage</dt>
              <dd>{formatNullablePercent(health.coveragePercent)}</dd>

              <dt>Largest gap</dt>
              <dd>{formatElapsedDuration(health.largestGapMs)}</dd>

              <dt>{latestReadingsLabel}</dt>
              <dd>{formatLatestReadings(health.latestReadings)}</dd>

              <dt>{wateringMarkersLabel}</dt>
              <dd>{formatNullableNumber(health.wateringMarkersInHistory)}</dd>

              <dt>Notes</dt>
              <dd>{formatNotes(health.notes)}</dd>
            </dl>
          </details>
        </div>
      ) : null}
    </div>
  )
}

const getStatusTone = (status: DeviceStatusHealthStatus): StatusSummaryTone => {
  if (status === 'healthy') {
    return 'good'
  }

  if (status === 'warning') {
    return 'watch'
  }

  return 'check'
}

const getPanelStatusLabel = (status: DeviceStatusHealthStatus): string => {
  if (status === 'healthy') {
    return 'Healthy'
  }

  if (status === 'warning') {
    return 'Check Data'
  }

  return 'Needs Attention'
}

const getStatusSubtitle = (status: DeviceStatusHealthStatus): string => {
  if (status === 'healthy') {
    return 'Recent garden reading history looks healthy.'
  }

  if (status === 'warning') {
    return 'Garden reading history has evidence to review.'
  }

  return 'Garden reading history is missing or stale.'
}

const getStatusSummaries = (health: DeviceStatusHealth<unknown>): StatusSummary[] => [
  getFreshnessSummary(health),
  getCoverageSummary(health),
  getLatestSampleSummary(health),
  getGapAndNotesSummary(health),
]

const getFreshnessSummary = (health: DeviceStatusHealth<unknown>): StatusSummary => {
  if (health.latestAgeMs === null || health.latestAgeMs < 0) {
    return {
      tone: 'check',
      label: 'No recent data',
      message: 'No latest garden report is available for this window.',
    }
  }

  const tone = health.status === 'no-recent-data' ? 'check' : getStatusTone(health.status)
  const label = tone === 'good' ? 'Fresh data' : 'Freshness needs review'

  return {
    tone,
    label,
    message: `Last report was ${formatDuration(health.latestAgeMs).toLowerCase()}.`,
  }
}

const getCoverageSummary = (health: DeviceStatusHealth<unknown>): StatusSummary => {
  if (health.expectedRows === null || health.coveragePercent === null) {
    return {
      tone: 'neutral',
      label: 'Coverage not evaluated',
      message: `${health.rowsInWindow.toLocaleString()} reports are present in this window.`,
    }
  }

  const tone = health.coveragePercent >= 70 ? 'good' : 'watch'
  const expectedRows = Math.round(health.expectedRows).toLocaleString()

  return {
    tone,
    label: tone === 'good' ? 'Good coverage' : 'Coverage needs review',
    message: `${health.rowsInWindow.toLocaleString()} of ${expectedRows} expected reports are present.`,
  }
}

const getLatestSampleSummary = (health: DeviceStatusHealth<unknown>): StatusSummary => {
  if (health.latestReadings === null) {
    return {
      tone: health.status === 'healthy' ? 'neutral' : 'check',
      label: 'Latest sample unavailable',
      message: 'The latest garden sample does not have displayable reading evidence.',
    }
  }

  const tone = health.status === 'healthy' ? 'good' : 'watch'

  return {
    tone,
    label: tone === 'good' ? 'Latest sample healthy' : 'Latest sample needs review',
    message: formatLatestReadings(health.latestReadings),
  }
}

const getGapAndNotesSummary = (health: DeviceStatusHealth<unknown>): StatusSummary => {
  if (health.notes.length === 0) {
    return {
      tone: 'good',
      label: 'No issues found',
      message: 'No issues found in this history window.',
    }
  }

  const tone = health.status === 'healthy' ? 'neutral' : getStatusTone(health.status)

  return {
    tone,
    label: tone === 'check' ? 'Needs attention' : 'Review notes',
    message: health.notes.join(' '),
  }
}

const getStatusMessage = (status: DeviceStatusHealthStatus): string | null => {
  if (status === 'warning') {
    return '\u26A0 Check Data'
  }

  if (status === 'no-recent-data' || status === 'no-data') {
    return '\u26A0 Needs Attention'
  }

  return null
}

const formatNullableNumber = (value: number | null): string =>
  value === null ? 'Not evaluated' : String(value)

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

const formatLatestReadings = (
  readings: unknown,
): string => {
  if (readings === null) {
    return 'Not available'
  }

  if (typeof readings === 'string') {
    return readings
  }

  if (!isLegacyLatestReadings(readings)) {
    return 'Not available'
  }

  return [
    `Temp ${formatReading(readings.temperature, 'F')}`,
    `Humidity ${formatReading(readings.humidity, '%')}`,
    `Moisture ${formatReading(readings.moisture, '%')}`,
  ].join(', ')
}

const formatReading = (value: number | null, unit: string): string =>
  value === null ? 'not available' : `${Math.round(value)}${unit}`

const formatNotes = (notes: string[]): string =>
  notes.length > 0 ? notes.join(' ') : 'No issues found in this history window.'

const isLegacyLatestReadings = (
  readings: unknown,
): readings is { temperature: number | null; humidity: number | null; moisture: number | null } =>
  typeof readings === 'object' &&
  readings !== null &&
  'temperature' in readings &&
  'humidity' in readings &&
  'moisture' in readings

export default SensorHealthPanel
