import type { CSSProperties } from 'react'
import type { DeviceDiagnostics } from '../api'
import './DeviceDiagnosticsPanel.css'

export const DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS = 35 * 60

type DiagnosticsStatus = 'fresh' | 'stale' | 'no-data'

type DeviceDiagnosticsPanelProps = {
  diagnostics: DeviceDiagnostics | null
  error: string | null
  fallbackDeviceLabel?: string
}

const statusStyles: Record<
  DiagnosticsStatus,
  {
    background: string
    border: string
    color: string
    dot: string
  }
> = {
  fresh: {
    background: '#f8fafc',
    border: '#16a34a',
    color: '#14532d',
    dot: '#16a34a',
  },
  stale: {
    background: '#fefce8',
    border: '#ca8a04',
    color: '#713f12',
    dot: '#ca8a04',
  },
  'no-data': {
    background: '#fef2f2',
    border: '#dc2626',
    color: '#7f1d1d',
    dot: '#dc2626',
  },
}

const DeviceDiagnosticsPanel = ({
  diagnostics,
  error,
  fallbackDeviceLabel = 'Selected device',
}: DeviceDiagnosticsPanelProps) => {
  const status = getDiagnosticsStatus(diagnostics)
  const styles = statusStyles[status]
  const panelStyle = {
    '--device-diagnostics-background': styles.background,
    '--device-diagnostics-border': styles.border,
    '--device-diagnostics-color': styles.color,
    '--device-diagnostics-dot': styles.dot,
  } as CSSProperties

  return (
    <details
      aria-label="Device diagnostics"
      className="device-diagnostics-panel"
      style={panelStyle}
    >
      <summary className="device-diagnostics-summary">
        <span className="device-diagnostics-title">
          <span aria-hidden="true" className="device-diagnostics-dot" />
          Device Diagnostics
        </span>
        <span className="device-diagnostics-status">
          {getDiagnosticsStatusLabel(status)}
        </span>
      </summary>

      <div className="device-diagnostics-details">
        {error ? <p className="device-diagnostics-error">{error}</p> : null}

        <dl className="device-diagnostics-list">
          <dt>Device label</dt>
          <dd>{diagnostics?.device_label ?? fallbackDeviceLabel}</dd>

          <dt>Device role</dt>
          <dd>{formatNullableText(diagnostics?.device_role)}</dd>

          <dt>Last heard</dt>
          <dd>{formatLastHeard(diagnostics)}</dd>

          <dt>Heartbeat reason</dt>
          <dd>{formatNullableText(diagnostics?.heartbeat_reason)}</dd>

          <dt>Uptime</dt>
          <dd>{formatDurationSeconds(diagnostics?.uptime_seconds)}</dd>

          <dt>Wi-Fi connected</dt>
          <dd>{formatBoolean(diagnostics?.wifi_connected)}</dd>

          <dt>Wi-Fi RSSI</dt>
          <dd>{formatRssi(diagnostics?.wifi_rssi)}</dd>

          <dt>Heap</dt>
          <dd>{formatHeap(diagnostics)}</dd>

          <dt>Watering evidence</dt>
          <dd>{formatWateringEvidence(diagnostics?.currently_watering)}</dd>

          <dt>Last watering duration</dt>
          <dd>{formatDurationSeconds(diagnostics?.last_watering_duration)}</dd>
        </dl>
      </div>
    </details>
  )
}

const getDiagnosticsStatus = (diagnostics: DeviceDiagnostics | null): DiagnosticsStatus => {
  if (!diagnostics?.last_heartbeat_at || diagnostics.heartbeat_age_seconds === null) {
    return 'no-data'
  }

  return diagnostics.heartbeat_age_seconds <= DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS
    ? 'fresh'
    : 'stale'
}

const getDiagnosticsStatusLabel = (status: DiagnosticsStatus): string => {
  if (status === 'fresh') {
    return 'Diagnostics Fresh'
  }

  if (status === 'stale') {
    return 'Diagnostics Stale'
  }

  return 'No Diagnostics Yet'
}

const formatNullableText = (value: string | null | undefined): string =>
  value?.trim() ? value : 'Not available'

const formatLastHeard = (diagnostics: DeviceDiagnostics | null): string => {
  if (!diagnostics?.last_heartbeat_at) {
    return 'No heartbeat received yet'
  }

  const heartbeatTime = new Date(diagnostics.last_heartbeat_at)

  if (!Number.isFinite(heartbeatTime.getTime())) {
    return 'Timestamp unavailable'
  }

  const age = formatDurationSeconds(diagnostics.heartbeat_age_seconds)
  return `${heartbeatTime.toLocaleString()} (${age} ago)`
}

const formatDurationSeconds = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value < 0 || !Number.isFinite(value)) {
    return 'Not available'
  }

  const totalSeconds = Math.round(value)

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`
  }

  const totalMinutes = Math.round(totalSeconds / 60)

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

const formatBoolean = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  return value ? 'Yes' : 'No'
}

const formatRssi = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Not available'
  }

  return `${value} dBm (${getRssiQualityLabel(value)})`
}

const getRssiQualityLabel = (value: number): string => {
  if (value >= -50) {
    return 'Excellent'
  }

  if (value >= -60) {
    return 'Good'
  }

  if (value >= -70) {
    return 'Fair'
  }

  if (value >= -80) {
    return 'Weak'
  }

  return 'Very Weak'
}

const formatHeap = (diagnostics: DeviceDiagnostics | null): string => {
  if (!diagnostics) {
    return 'Not available'
  }

  const freeHeap = formatBytes(diagnostics.free_heap)
  const minFreeHeap = formatBytes(diagnostics.min_free_heap)

  return `${freeHeap} free, ${minFreeHeap} minimum free`
}

const formatBytes = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value < 0 || !Number.isFinite(value)) {
    return 'not available'
  }

  return `${Math.round(value / 1024).toLocaleString()} KB`
}

const formatWateringEvidence = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'No latest heartbeat evidence'
  }

  return value
    ? 'Latest heartbeat reported watering in progress'
    : 'Latest heartbeat did not report watering in progress'
}

export default DeviceDiagnosticsPanel
