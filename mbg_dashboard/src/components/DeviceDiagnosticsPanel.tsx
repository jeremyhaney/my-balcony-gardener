import type { DeviceDiagnostics } from '../api'
import './DeviceDiagnosticsPanel.css'

export const DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS = 35 * 60

type SummaryTone = 'good' | 'watch' | 'check' | 'neutral'

type DiagnosticsSummary = {
  tone: SummaryTone
  label: string
  message: string
}

type DeviceDiagnosticsPanelProps = {
  diagnostics: DeviceDiagnostics | null
  error: string | null
  fallbackDeviceLabel?: string
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

const DeviceDiagnosticsPanel = ({
  diagnostics,
  error,
  fallbackDeviceLabel = 'Selected device',
  isOpen,
  onOpenChange,
}: DeviceDiagnosticsPanelProps) => {
  const summaries = [
    getFreshnessSummary(diagnostics),
    getCloudSummary(diagnostics),
    getConnectionSummary(diagnostics),
    getWateringCapabilitySummary(diagnostics),
  ]
  const pillSummary = getPillSummary(summaries)
  const showPillStatus = pillSummary.tone !== 'good'

  return (
    <div
      aria-label="Device diagnostics"
      className="device-diagnostics-panel"
    >
      <button
        aria-controls="device-diagnostics-details"
        aria-expanded={isOpen ?? false}
        className={`device-diagnostics-pill is-${pillSummary.tone}`}
        onClick={() => onOpenChange?.(!isOpen)}
        type="button"
      >
        <span aria-hidden="true" className="device-diagnostics-dot" />
        <span className="device-diagnostics-pill-title">Device Diagnostics</span>
        {showPillStatus ? (
          <span className="device-diagnostics-pill-status">{pillSummary.label}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="device-diagnostics-popover" id="device-diagnostics-details">
          <div className="device-diagnostics-heading">
            <div>
              <h2>Device Diagnostics</h2>
              <p>{diagnostics?.device_label ?? fallbackDeviceLabel}</p>
            </div>
            <span className={`device-diagnostics-overall is-${pillSummary.tone}`}>
              {pillSummary.label}
            </span>
          </div>

          {error ? <p className="device-diagnostics-error">{error}</p> : null}

          <div className="device-diagnostics-summary-grid">
            {summaries.map((summary) => (
              <article
                key={summary.label}
                className={`device-diagnostics-summary-card is-${summary.tone}`}
              >
                <h3>{summary.label}</h3>
                <p>{summary.message}</p>
              </article>
            ))}
          </div>

          <details className="device-diagnostics-advanced">
            <summary>Advanced diagnostics evidence</summary>
            <dl className="device-diagnostics-list">
            <dt>Device key</dt>
            <dd>{formatNullableText(diagnostics?.device_key)}</dd>

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

            <dt>Wi-Fi reconnect attempts</dt>
            <dd>{formatInteger(diagnostics?.wifi_reconnect_attempt_count)}</dd>

            <dt>Wi-Fi begin-recovery attempts</dt>
            <dd>{formatInteger(diagnostics?.wifi_begin_recovery_attempt_count)}</dd>

            <dt>Wi-Fi disconnect events</dt>
            <dd>{formatInteger(diagnostics?.wifi_disconnect_event_count)}</dd>

            <dt>Wi-Fi got-IP events</dt>
            <dd>{formatInteger(diagnostics?.wifi_got_ip_event_count)}</dd>

            <dt>Last Wi-Fi status code</dt>
            <dd>{formatInteger(diagnostics?.last_wifi_status_code)}</dd>

            <dt>Last Wi-Fi disconnect reason</dt>
            <dd>{formatInteger(diagnostics?.last_wifi_disconnect_reason)}</dd>

            <dt>Last Wi-Fi disconnected uptime</dt>
            <dd>{formatDurationSeconds(diagnostics?.last_wifi_disconnected_uptime_seconds)}</dd>

            <dt>Last Wi-Fi reconnected uptime</dt>
            <dd>{formatDurationSeconds(diagnostics?.last_wifi_reconnected_uptime_seconds)}</dd>

            <dt>Last recovery action</dt>
            <dd>{formatNullableText(diagnostics?.last_network_recovery_action)}</dd>

            <dt>Supabase HTTP status</dt>
            <dd>{formatInteger(diagnostics?.last_supabase_http_status)}</dd>

            <dt>Consecutive cloud failures</dt>
            <dd>{formatInteger(diagnostics?.consecutive_supabase_failures)}</dd>

            <dt>Cloud error category</dt>
            <dd>{formatNullableText(diagnostics?.last_supabase_error_category)}</dd>

            <dt>Successful reading post</dt>
            <dd>{formatTimestamp(diagnostics?.last_successful_telemetry_post_at)}</dd>

            <dt>Successful diagnostics post</dt>
            <dd>{formatTimestamp(diagnostics?.last_successful_diagnostics_post_at)}</dd>

            <dt>Heap</dt>
            <dd>{formatHeap(diagnostics)}</dd>

            <dt>Watering evidence</dt>
            <dd>{formatWateringEvidence(diagnostics?.currently_watering)}</dd>

            <dt>Last watering duration</dt>
            <dd>{formatDurationSeconds(diagnostics?.last_watering_duration)}</dd>

            <dt>Pump control available</dt>
            <dd>{formatBoolean(diagnostics?.pump_control_available)}</dd>

            <dt>Device can water</dt>
            <dd>{formatBoolean(diagnostics?.device_can_water)}</dd>
          </dl>
        </details>
      </div>
      ) : null}
    </div>
  )
}

const getPillSummary = (summaries: DiagnosticsSummary[]): DiagnosticsSummary => {
  const checkSummary = summaries.find((summary) => summary.tone === 'check')

  if (checkSummary) {
    return checkSummary.label === 'No recent diagnostics'
      ? checkSummary
      : {
          tone: 'check',
          label: 'Check diagnostics',
          message: checkSummary.message,
        }
  }

  const watchSummary = summaries.find((summary) => summary.tone === 'watch')

  if (watchSummary) {
    return {
      tone: 'watch',
      label: 'Check diagnostics',
      message: watchSummary.message,
    }
  }

  return {
    tone: 'good',
    label: 'Diagnostics fresh',
    message: 'The device has reported heartbeat evidence recently.',
  }
}

const getFreshnessSummary = (
  diagnostics: DeviceDiagnostics | null,
): DiagnosticsSummary => {
  if (!diagnostics?.last_heartbeat_at || diagnostics.heartbeat_age_seconds === null) {
    return {
      tone: 'check',
      label: 'No recent diagnostics',
      message: 'The online dashboard has not received heartbeat evidence from this garden unit yet.',
    }
  }

  if (diagnostics.heartbeat_age_seconds > DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS) {
    return {
      tone: 'watch',
      label: 'Diagnostics stale',
      message: 'The online dashboard has not received a recent heartbeat from this garden unit.',
    }
  }

  return {
    tone: 'good',
    label: 'Diagnostics fresh',
    message: 'The device has reported heartbeat evidence recently.',
  }
}

const getCloudSummary = (diagnostics: DeviceDiagnostics | null): DiagnosticsSummary => {
  if (!diagnostics?.last_heartbeat_at) {
    return {
      tone: 'neutral',
      label: 'Cloud reporting unknown',
      message: 'No garden unit heartbeat evidence is available to judge cloud reporting yet.',
    }
  }

  const errorCategory = normalizeText(diagnostics.last_supabase_error_category)
  const failureCount = diagnostics.consecutive_supabase_failures ?? 0
  const httpStatus = diagnostics.last_supabase_http_status
  const hasErrorCategory = Boolean(errorCategory && errorCategory !== 'none')
  const hasHttpProblem = httpStatus !== null && httpStatus !== 201

  if (failureCount > 0 || hasErrorCategory || hasHttpProblem) {
    return {
      tone: 'check',
      label: 'Cloud reporting needs review',
      message: 'The device is reachable, but recent cloud post evidence shows a reporting problem.',
    }
  }

  if (httpStatus === 201) {
    return {
      tone: 'good',
      label: 'Cloud reporting healthy',
      message: 'The latest device report reached the cloud successfully.',
    }
  }

  return {
    tone: 'neutral',
    label: 'Cloud reporting unknown',
    message: 'The latest heartbeat does not include cloud post status evidence yet.',
  }
}

const getConnectionSummary = (
  diagnostics: DeviceDiagnostics | null,
): DiagnosticsSummary => {
  if (!diagnostics?.last_heartbeat_at) {
    return {
      tone: 'neutral',
      label: 'Connection unknown',
      message: 'No garden unit heartbeat evidence is available to judge connection state yet.',
    }
  }

  if (diagnostics.heartbeat_age_seconds === null) {
    return {
      tone: 'neutral',
      label: 'Connection unknown',
      message: 'The latest heartbeat age is unavailable.',
    }
  }

  if (
    diagnostics.heartbeat_age_seconds > DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS ||
    diagnostics.wifi_connected === false
  ) {
    return {
      tone: 'check',
      label: 'Connection needs review',
      message: 'The latest garden unit evidence is stale or reports Wi-Fi as disconnected.',
    }
  }

  const reconnectAttempts = diagnostics.wifi_reconnect_attempt_count ?? 0
  const beginRecoveryAttempts = diagnostics.wifi_begin_recovery_attempt_count ?? 0
  const recoveryAction = normalizeText(diagnostics.last_network_recovery_action)
  const hasRecoveryAction =
    recoveryAction === 'wifi_reconnect' ||
    recoveryAction === 'wifi_begin_recovery' ||
    recoveryAction === 'wifi_begin_recovery_attempt'

  if (reconnectAttempts > 0 || beginRecoveryAttempts > 0 || hasRecoveryAction) {
    return {
      tone: 'watch',
      label: 'Connection recovered',
      message: 'The device reported Wi-Fi recovery activity and is reporting again.',
    }
  }

  return {
    tone: 'good',
    label: 'Connection stable',
    message: 'The device has not reported Wi-Fi recovery attempts since the latest boot.',
  }
}

const getWateringCapabilitySummary = (
  diagnostics: DeviceDiagnostics | null,
): DiagnosticsSummary => {
  if (!diagnostics?.last_heartbeat_at) {
    return {
      tone: 'neutral',
      label: 'Watering evidence unknown',
      message: 'No latest heartbeat evidence is available for watering capability.',
    }
  }

  if (diagnostics.device_can_water === true && diagnostics.pump_control_available === true) {
    return {
      tone: 'neutral',
      label: 'Watering capable',
      message:
        'Latest garden unit evidence says this unit can water itself; the online dashboard remains read-only.',
    }
  }

  if (diagnostics.device_can_water === false && diagnostics.pump_control_available === false) {
    return {
      tone: 'neutral',
      label: 'No watering authority',
      message: 'Latest garden unit evidence says this unit does not have watering authority.',
    }
  }

  return {
    tone: 'watch',
    label: 'Watering evidence needs review',
    message: 'Latest pump capability and device watering evidence are incomplete or mixed.',
  }
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

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available'
  }

  const parsedValue = new Date(value)
  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : value
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

const formatInteger = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Not available'
  }

  return Math.round(value).toLocaleString()
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

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? ''

export default DeviceDiagnosticsPanel
