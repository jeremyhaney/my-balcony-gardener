import type { CSSProperties } from 'react'
import type { TelemetryHealth, TelemetryHealthStatus } from '../telemetryHealth'
import './SensorHealthPanel.css'

type SensorHealthPanelProps = {
  health: TelemetryHealth
}

const statusStyles: Record<
  TelemetryHealthStatus,
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

const SensorHealthPanel = ({ health }: SensorHealthPanelProps) => {
  const styles = statusStyles[health.status]
  const statusMessage = getStatusMessage(health.status)
  const panelStyle = {
    '--sensor-health-background': styles.background,
    '--sensor-health-border': styles.border,
    '--sensor-health-color': styles.color,
    '--sensor-health-dot': styles.dot,
    '--sensor-health-shadow': styles.shadow,
  } as CSSProperties

  return (
    <details
      aria-label="Device status"
      className="sensor-health-panel"
      style={panelStyle}
    >
      <summary className={`sensor-health-summary sensor-health-summary-${health.status}`}>
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
      </summary>

      <div className="sensor-health-details">
        <dl className="sensor-health-list">
          <dt>Last report</dt>
          <dd style={{ margin: 0 }}>{formatDuration(health.latestAgeMs)}</dd>

          <dt>Rows in window</dt>
          <dd style={{ margin: 0 }}>{health.rowsInWindow}</dd>

          <dt>Expected rows</dt>
          <dd style={{ margin: 0 }}>{formatNullableNumber(health.expectedRows)}</dd>

          <dt>Coverage</dt>
          <dd style={{ margin: 0 }}>{formatNullablePercent(health.coveragePercent)}</dd>

          <dt>Largest gap</dt>
          <dd style={{ margin: 0 }}>{formatElapsedDuration(health.largestGapMs)}</dd>

          <dt>Latest readings</dt>
          <dd style={{ margin: 0 }}>{formatLatestReadings(health.latestReadings)}</dd>

          <dt>Watering history markers</dt>
          <dd style={{ margin: 0 }}>{health.wateringMarkersInHistory}</dd>

          <dt>Notes</dt>
          <dd style={{ margin: 0 }}>{formatNotes(health.notes)}</dd>
        </dl>
      </div>
    </details>
  )
}

const getStatusMessage = (status: TelemetryHealthStatus): string | null => {
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
  readings: TelemetryHealth['latestReadings'],
): string => {
  if (readings === null) {
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

export default SensorHealthPanel
