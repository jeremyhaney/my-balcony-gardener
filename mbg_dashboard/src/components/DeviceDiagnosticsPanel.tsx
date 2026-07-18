import type { ReactNode } from 'react'
import type { DeviceDiagnostics } from '../api'
import './DeviceDiagnosticsPanel.css'

export const DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS = 35 * 60

type SummaryTone = 'good' | 'watch' | 'check' | 'neutral'

type DiagnosticsSummary = {
  heading: 'Device Reporting' | 'Wi-Fi Connection' | 'Hosted Reporting'
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
    getConnectionSummary(diagnostics),
    getCloudSummary(diagnostics),
  ]
  const pillSummary = getPillSummary(summaries)
  const showPillStatus = pillSummary.tone !== 'good'

  return (
    <div
      aria-label="MBG Diagnostics"
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
        <span className="device-diagnostics-pill-title">MBG Diagnostics</span>
        {showPillStatus ? (
          <span className="device-diagnostics-pill-status">{pillSummary.label}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="device-diagnostics-popover" id="device-diagnostics-details">
          <div className="device-diagnostics-heading">
            <div>
              <h2>MBG Diagnostics</h2>
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
                key={summary.heading}
                className={`device-diagnostics-summary-card is-${summary.tone}`}
              >
                <h3>{summary.heading}</h3>
                <p><strong>{summary.label}.</strong> {summary.message}</p>
              </article>
            ))}
          </div>

          <details className="device-diagnostics-advanced">
            <summary>Advanced diagnostics evidence</summary>
            <DiagnosticEvidenceGroup heading="Device">
              <dt>Device key</dt><dd>{formatNullableText(diagnostics?.device_key)}</dd>
              <dt>Device role</dt><dd>{formatNullableText(diagnostics?.device_role)}</dd>
              <dt>Firmware version</dt><dd>{formatRecordedText(diagnostics?.firmware_version)}</dd>
              <dt>Build profile</dt><dd>{formatRecordedText(diagnostics?.build_profile)}</dd>
              <dt>Last heard</dt><dd>{formatLastHeard(diagnostics)}</dd>
              <dt>Heartbeat reason</dt><dd>{formatNullableText(diagnostics?.heartbeat_reason)}</dd>
            </DiagnosticEvidenceGroup>

            <DiagnosticEvidenceGroup heading="Wi-Fi recovery">
              <dt>Wi-Fi connected</dt><dd>{formatBoolean(diagnostics?.wifi_connected)}</dd>
              <dt>Wi-Fi RSSI</dt><dd>{formatRssi(diagnostics?.wifi_rssi)}</dd>
              <dt>Wi-Fi status</dt><dd>{formatLabeledCode(diagnostics?.wifi_status_label, diagnostics?.wifi_status_code)}</dd>
              <dt>Wi-Fi reconnect attempts since boot</dt><dd>{formatInteger(diagnostics?.wifi_reconnect_attempts_since_boot)}</dd>
              <dt>Full Wi-Fi recovery attempts since boot</dt><dd>{formatInteger(diagnostics?.wifi_full_recovery_attempts_since_boot)}</dd>
              <dt>Wi-Fi disconnects since boot</dt><dd>{formatInteger(diagnostics?.wifi_disconnects_since_boot)}</dd>
              <dt>Wi-Fi IP acquisitions since boot</dt><dd>{formatInteger(diagnostics?.wifi_ip_acquisitions_since_boot)}</dd>
              <dt>Last Wi-Fi disconnect reason</dt>
              <dd>{formatLabeledCode(diagnostics?.last_wifi_disconnect_reason_label, diagnostics?.last_wifi_disconnect_reason)}</dd>
              <dt>Last Wi-Fi disconnect uptime</dt><dd>{formatRecordedDuration(diagnostics?.last_wifi_disconnect_uptime_seconds)}</dd>
              <dt>Last Wi-Fi IP-acquired uptime</dt><dd>{formatRecordedDuration(diagnostics?.last_wifi_ip_acquired_uptime_seconds)}</dd>
              <dt>Last Wi-Fi activity</dt><dd>{formatRecordedLabel(diagnostics?.last_wifi_activity)}</dd>
            </DiagnosticEvidenceGroup>

            <DiagnosticEvidenceGroup heading="Hosted reporting">
              <dt>Last hosted HTTP result</dt><dd>{formatLabeledCode(diagnostics?.last_http_status_label, diagnostics?.last_http_status, false)}</dd>
              <dt>Consecutive hosted-post failures</dt><dd>{formatInteger(diagnostics?.consecutive_failures)}</dd>
              <dt>Last hosted error category</dt><dd>{formatRecordedLabel(diagnostics?.last_error_category)}</dd>
              <dt>Last successful measurement post</dt><dd>{formatTimestamp(diagnostics?.last_successful_measurement_post_at)}</dd>
              <dt>Measurement-post uptime</dt><dd>{formatRecordedDuration(diagnostics?.last_successful_measurement_post_uptime_seconds)}</dd>
              <dt>Last successful status post</dt><dd>{formatTimestamp(diagnostics?.last_successful_status_post_at)}</dd>
              <dt>Status-post uptime</dt><dd>{formatRecordedDuration(diagnostics?.last_successful_status_post_uptime_seconds)}</dd>
            </DiagnosticEvidenceGroup>

            <DiagnosticEvidenceGroup heading="Runtime">
              <dt>Uptime</dt><dd>{formatDurationSeconds(diagnostics?.uptime_seconds)}</dd>
              <dt>Free heap</dt><dd>{formatBytes(diagnostics?.free_heap_bytes)}</dd>
              <dt>Minimum free heap</dt><dd>{formatBytes(diagnostics?.minimum_free_heap_bytes)}</dd>
            </DiagnosticEvidenceGroup>

            <DiagnosticEvidenceGroup heading="Watering runtime">
              <dt>Watering evidence</dt><dd>{formatWateringEvidence(diagnostics?.currently_watering)}</dd>
              <dt>Active watering trigger</dt><dd>{formatActiveTrigger(diagnostics?.currently_watering, diagnostics?.active_trigger_source)}</dd>
              <dt>Last watering time</dt><dd>{formatTimestamp(diagnostics?.last_watering_at)}</dd>
              <dt>Last watering duration</dt><dd>{formatRecordedDuration(diagnostics?.last_watering_duration_seconds)}</dd>
            </DiagnosticEvidenceGroup>
          </details>
        </div>
      ) : null}
    </div>
  )
}

// Advanced diagnostics remain grouped by evidence domain without changing source fields.
const DiagnosticEvidenceGroup = ({
  heading,
  children,
}: {
  heading: 'Device' | 'Wi-Fi recovery' | 'Hosted reporting' | 'Runtime' | 'Watering runtime'
  children: ReactNode
}) => (
  <section>
    <h3>{heading}</h3>
    <dl className="device-diagnostics-list">{children}</dl>
  </section>
)

// Diagnostics summary helpers report independent heartbeat, Wi-Fi, and hosted-post evidence.
const getPillSummary = (summaries: DiagnosticsSummary[]): DiagnosticsSummary => {
  const checkSummary = summaries.find((summary) => summary.tone === 'check')

  if (checkSummary) {
    return checkSummary.label === 'No recent diagnostics'
      ? checkSummary
      : {
          heading: checkSummary.heading,
          tone: 'check',
          label: 'Evidence needs review',
          message: checkSummary.message,
        }
  }

  const watchSummary = summaries.find((summary) => summary.tone === 'watch')

  if (watchSummary) {
    return {
      heading: watchSummary.heading,
      tone: 'watch',
      label: 'Evidence needs review',
      message: watchSummary.message,
    }
  }

  return {
    heading: 'Device Reporting',
    tone: 'good',
    label: 'Recent evidence received',
    message: 'A heartbeat was received within the current threshold.',
  }
}

const getFreshnessSummary = (
  diagnostics: DeviceDiagnostics | null,
): DiagnosticsSummary => {
  if (!diagnostics?.last_heartbeat_at || diagnostics.heartbeat_age_seconds === null) {
    return {
      heading: 'Device Reporting',
      tone: 'check',
      label: 'No heartbeat recorded',
      message: 'No heartbeat timestamp is available for this garden unit.',
    }
  }

  if (diagnostics.heartbeat_age_seconds > DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS) {
    return {
      heading: 'Device Reporting',
      tone: 'watch',
      label: 'Heartbeat not current',
      message: `Latest heartbeat received ${formatDurationSeconds(diagnostics.heartbeat_age_seconds)} ago.`,
    }
  }

  return {
    heading: 'Device Reporting',
    tone: 'good',
    label: 'Heartbeat current',
    message: `Latest heartbeat received ${formatDurationSeconds(diagnostics.heartbeat_age_seconds)} ago.`,
  }
}

const getCloudSummary = (diagnostics: DeviceDiagnostics | null): DiagnosticsSummary => {
  if (!diagnostics?.last_heartbeat_at) {
    return {
      heading: 'Hosted Reporting',
      tone: 'neutral',
      label: 'Hosted-post evidence unavailable',
      message: 'No heartbeat evidence is available for hosted-post reporting.',
    }
  }

  const errorCategory = normalizeText(diagnostics.last_error_category)
  const failureCount = diagnostics.consecutive_failures ?? 0
  const httpStatus = diagnostics.last_http_status
  const hasErrorCategory = Boolean(errorCategory && errorCategory !== 'none')
  const hasHttpProblem = httpStatus !== null && (httpStatus < 200 || httpStatus >= 300)

  if (failureCount > 0 || hasErrorCategory || hasHttpProblem) {
    const facts = [
      failureCount > 0
        ? `${failureCount.toLocaleString()} consecutive hosted-post failure${
            failureCount === 1 ? '' : 's'
          } recorded.`
        : null,
      httpStatus !== null
        ? `Latest hosted HTTP result: ${formatLabeledCode(
            diagnostics.last_http_status_label,
            httpStatus,
            false,
          )}.`
        : null,
      hasErrorCategory
        ? `Last hosted error category: ${formatRecordedLabel(
            diagnostics.last_error_category,
          )}.`
        : null,
    ].filter((fact): fact is string => Boolean(fact))

    return {
      heading: 'Hosted Reporting',
      tone: 'check',
      label: 'Hosted-post evidence needs review',
      message: facts.join(' '),
    }
  }

  if (httpStatus !== null && httpStatus >= 200 && httpStatus < 300) {
    return {
      heading: 'Hosted Reporting',
      tone: 'good',
      label: 'Hosted post accepted',
      message: `Latest hosted post returned ${formatLabeledCode(diagnostics.last_http_status_label, httpStatus, false)}.`,
    }
  }

  return {
    heading: 'Hosted Reporting',
    tone: 'neutral',
    label: 'Hosted-post result unavailable',
    message: 'The latest heartbeat does not include an HTTP result.',
  }
}

const getConnectionSummary = (
  diagnostics: DeviceDiagnostics | null,
): DiagnosticsSummary => {
  if (!diagnostics?.last_heartbeat_at) {
    return {
      heading: 'Wi-Fi Connection',
      tone: 'neutral',
      label: 'Wi-Fi evidence unavailable',
      message: 'No heartbeat evidence is available for Wi-Fi connection state.',
    }
  }

  if (diagnostics.heartbeat_age_seconds === null) {
    return {
      heading: 'Wi-Fi Connection',
      tone: 'neutral',
      label: 'Wi-Fi evidence unavailable',
      message: 'The latest heartbeat age is unavailable.',
    }
  }

  if (
    diagnostics.heartbeat_age_seconds > DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS ||
    diagnostics.wifi_connected === false
  ) {
    return {
      heading: 'Wi-Fi Connection',
      tone: 'check',
      label: 'Wi-Fi evidence needs review',
      message:
        diagnostics.wifi_connected === false
          ? 'Latest heartbeat reports Wi-Fi disconnected.'
          : 'Latest heartbeat is older than the current diagnostics threshold.',
    }
  }

  if (diagnostics.wifi_connected !== true) {
    return {
      heading: 'Wi-Fi Connection',
      tone: 'neutral',
      label: 'Wi-Fi state unavailable',
      message: 'The latest heartbeat does not include a Wi-Fi connected state.',
    }
  }

  const reconnectAttempts = diagnostics.wifi_reconnect_attempts_since_boot ?? 0
  const beginRecoveryAttempts = diagnostics.wifi_full_recovery_attempts_since_boot ?? 0
  const recoveryAction = normalizeText(diagnostics.last_wifi_activity)
  const hasRecoveryAction =
    recoveryAction === 'reconnect_requested' || recoveryAction === 'full_recovery_started'

  if (reconnectAttempts > 0 || beginRecoveryAttempts > 0 || hasRecoveryAction) {
    return {
      heading: 'Wi-Fi Connection',
      tone: 'watch',
      label: 'Wi-Fi recovery activity recorded',
      message: `Latest heartbeat reports Wi-Fi ${diagnostics.wifi_connected === true ? 'connected' : 'state unavailable'}; ${reconnectAttempts.toLocaleString()} reconnect attempts and ${beginRecoveryAttempts.toLocaleString()} full recovery attempts are recorded since boot.`,
    }
  }

  return {
    heading: 'Wi-Fi Connection',
    tone: 'good',
    label: 'Wi-Fi connected',
    message: 'Latest heartbeat reports Wi-Fi connected. No reconnect attempts have been recorded since this boot.',
  }
}

const formatNullableText = (value: string | null | undefined): string =>
  value?.trim() ? value : 'Not available'

const formatRecordedText = (value: string | null | undefined): string =>
  value?.trim() ? value : 'Not recorded'

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
    return 'Not recorded'
  }

  const parsedValue = new Date(value)
  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : value
}

const formatRecordedDuration = (value: number | null | undefined): string =>
  value === null || value === undefined ? 'Not recorded' : formatDurationSeconds(value)

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

const formatBytes = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value < 0 || !Number.isFinite(value)) {
    return 'Not recorded'
  }

  return `${Math.round(value / 1024).toLocaleString()} KB`
}

const formatLabeledCode = (
  label: string | null | undefined,
  code: number | null | undefined,
  includeCodeWord = true,
): string => {
  if (code === null || code === undefined || normalizeText(label) === 'not_recorded') {
    return 'Not recorded'
  }

  const readableLabel = formatSnakeCase(label)
  const codeLabel = includeCodeWord ? `code ${code}` : String(code)
  return `${readableLabel} (${codeLabel})`
}

const formatRecordedLabel = (value: string | null | undefined): string =>
  value?.trim() ? formatSnakeCase(value) : 'Not recorded'

const formatSnakeCase = (value: string | null | undefined): string => {
  const normalized = value?.trim().replace(/_/g, ' ')

  if (!normalized) {
    return 'Unknown'
  }

  return (normalized.charAt(0).toUpperCase() + normalized.slice(1)).replace(/^Ip\b/, 'IP')
}

const formatActiveTrigger = (
  currentlyWatering: boolean | null | undefined,
  triggerSource: string | null | undefined,
): string => {
  if (currentlyWatering === false) {
    return 'None'
  }

  return triggerSource?.trim() ? formatSnakeCase(triggerSource) : 'Not recorded'
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
