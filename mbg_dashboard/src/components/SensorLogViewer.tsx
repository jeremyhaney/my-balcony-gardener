import { type ChangeEvent, useEffect, useState } from 'react'
import {
  fetchDeviceDiagnostics,
  fetchHistoryLogs,
  fetchHostedGen2Measurements,
  type DeviceDiagnostics,
} from '../api'
import {
  getHistoryControlStateFromUrl,
  getHistoryDeviceOption,
  getHistoryWindowOption,
  HISTORY_DEVICE_OPTIONS,
  HISTORY_WINDOW_OPTIONS,
  type HistoryDeviceOption,
  type HistoryWindowOption,
  updateHistoryControlUrl,
} from '../historyControls'
import { calculateHostedGen2Health } from '../hostedGen2Health'
import { calculateTelemetryHealth } from '../telemetryHealth'
import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import type { SensorLogRow } from '../types/sensorLog'
import DeviceDiagnosticsPanel from './DeviceDiagnosticsPanel'
import DualAxisChart from './DualAxisChart'
import HostedGen2Measurements from './HostedGen2Measurements'
import HostedGen2TrendChart from './HostedGen2TrendChart'
import SensorHealthPanel from './SensorHealthPanel'

const isValidPercent = (value: number): boolean =>
  Number.isFinite(value) && value >= 0 && value <= 100

const sanitizePercent = (value: number): number | null => (isValidPercent(value) ? value : null)

const hasUsableTimestamp = (timestamp: string): boolean =>
  Number.isFinite(new Date(timestamp).getTime())

const HISTORY_REFRESH_INTERVAL_MS = 10000
const HOSTED_GEN2_ROWS_PER_HISTORY_ROW_ESTIMATE = 8

type SensorLogViewerProps = {
  isHostedReadonly?: boolean
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error'

const SensorLogViewer = ({ isHostedReadonly = false }: SensorLogViewerProps) => {
  const [logs, setLogs] = useState<SensorLogRow[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<DeviceDiagnostics | null>(null)
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null)
  const [hostedGen2Rows, setHostedGen2Rows] = useState<HostedGen2MeasurementRow[]>([])
  const [hostedGen2Error, setHostedGen2Error] = useState<string | null>(null)
  const [isHostedGen2Loading, setIsHostedGen2Loading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<HistoryDeviceOption>(
    () => getHistoryControlStateFromUrl().device,
  )
  const [selectedWindow, setSelectedWindow] = useState<HistoryWindowOption>(
    () => getHistoryControlStateFromUrl().window,
  )

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      const lowerBoundIso = selectedWindow.getLowerBoundIso(new Date())
      const hostedGen2Request = isHostedReadonly
        ? fetchHostedGen2Measurements(selectedDevice.deviceId, {
            startTime: lowerBoundIso,
            limit: Math.max(1000, selectedWindow.limit * HOSTED_GEN2_ROWS_PER_HISTORY_ROW_ESTIMATE),
          })
            .then((rows) => ({ rows, error: null }))
            .catch((error: unknown) => ({
              rows: [] as HostedGen2MeasurementRow[],
              error: `Supabase Gen2 measurements are currently unavailable: ${getErrorMessage(error)}`,
            }))
        : Promise.resolve({ rows: [] as HostedGen2MeasurementRow[], error: null })

      if (isHostedReadonly) {
        setIsHostedGen2Loading(true)
      }

      const [historyResult, diagnosticsResult, hostedGen2Result] = await Promise.all([
        fetchHistoryLogs(
          selectedWindow.limit,
          selectedDevice.deviceId,
          lowerBoundIso,
        ),
        fetchDeviceDiagnostics(selectedDevice.deviceId),
        hostedGen2Request,
      ])

      if (!isMounted) {
        return
      }

      setLogs(historyResult.rows)
      setHistoryError(historyResult.error)
      setDiagnostics(diagnosticsResult.diagnostics)
      setDiagnosticsError(diagnosticsResult.error)
      setHostedGen2Rows(hostedGen2Result.rows)
      setHostedGen2Error(hostedGen2Result.error)
      setIsHostedGen2Loading(false)
      setIsLoading(false)
    }

    void loadHistory()

    const refreshTimer = window.setInterval(() => {
      void loadHistory()
    }, HISTORY_REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
    }
  }, [isHostedReadonly, selectedDevice, selectedWindow])

  useEffect(() => {
    const handlePopState = () => {
      const nextControlState = getHistoryControlStateFromUrl()
      setSelectedDevice(nextControlState.device)
      setSelectedWindow(nextControlState.window)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const handleDeviceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDevice = getHistoryDeviceOption(event.target.value)

    if (!nextDevice) {
      return
    }

    setSelectedDevice(nextDevice)
    updateHistoryControlUrl(nextDevice.key, selectedWindow.key)
  }

  const handleWindowChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextWindow = getHistoryWindowOption(event.target.value)

    if (!nextWindow) {
      return
    }

    setSelectedWindow(nextWindow)
    updateHistoryControlUrl(selectedDevice.key, nextWindow.key)
  }

  const chartLogs = [...logs]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((log) => {
      const temperature = Number.isFinite(log.data.temperature) ? log.data.temperature : null
      const humidity = sanitizePercent(log.data.humidity)
      const moisture = sanitizePercent(log.data.moisture)

      return {
        timestamp: log.timestamp,
        temperature,
        humidity,
        moisture,
        watering: log.data.watering,
      }
    })
    .filter(
      (log) =>
        hasUsableTimestamp(log.timestamp) &&
        (log.temperature !== null || log.humidity !== null || log.moisture !== null)
    )

  const telemetryHealth = isLoading
    ? null
    : isHostedReadonly
      ? calculateHostedGen2Health(hostedGen2Rows, selectedWindow.key)
      : calculateTelemetryHealth(logs, selectedWindow.key)
  const selectedDeviceLabel = isHostedReadonly ? selectedDevice.hostedLabel : selectedDevice.label

  const historyControls = (
    <div
      aria-label="Sensor history controls"
      className="sensor-history-controls"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isHostedReadonly ? '0.6rem' : '0.75rem',
        alignItems: 'flex-end',
        marginBottom: isHostedReadonly ? 0 : '1rem',
      }}
    >
      <label style={{ display: 'grid', gap: '0.25rem', fontSize: isHostedReadonly ? '0.82rem' : '0.9rem' }}>
        <span>History Device</span>
        <select
          value={selectedDevice.key}
          onChange={handleDeviceChange}
          style={{
            minWidth: isHostedReadonly ? '180px' : '220px',
            padding: isHostedReadonly ? '0.3rem 0.45rem' : '0.4rem',
          }}
        >
          {HISTORY_DEVICE_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {isHostedReadonly ? option.hostedLabel : option.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: '0.25rem', fontSize: isHostedReadonly ? '0.82rem' : '0.9rem' }}>
        <span>Window</span>
        <select
          value={selectedWindow.key}
          onChange={handleWindowChange}
          style={{
            minWidth: isHostedReadonly ? '140px' : '160px',
            padding: isHostedReadonly ? '0.3rem 0.45rem' : '0.4rem',
          }}
        >
          {HISTORY_WINDOW_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )

  const historyErrorMessage = historyError ? (
    <p className="mb-3 text-sm" style={{ color: '#7f1d1d' }}>
      {historyError}
    </p>
  ) : null

  const deviceStatusPanels = (
    <div className="device-status-panels">
      {telemetryHealth ? <SensorHealthPanel health={telemetryHealth} /> : null}

      <DeviceDiagnosticsPanel
        diagnostics={diagnostics}
        error={diagnosticsError}
        fallbackDeviceLabel={selectedDeviceLabel}
      />
    </div>
  )

  const sensorHistoryHeader = (
    <>
      <h2 className="text-xl font-bold mb-2">Sensor History</h2>
      {historyControls}
      {historyErrorMessage}
    </>
  )

  const sensorHistoryChart = (
    <>
      {isLoading ? (
        <p className="text-sm">Loading history...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm">No Sensor History rows in this window.</p>
      ) : chartLogs.length === 0 ? (
        <p className="text-sm">History rows were found, but no valid readings are available to chart yet.</p>
      ) : (
        <DualAxisChart sensorLogs={chartLogs} historyWindowKey={selectedWindow.key} />
      )}
    </>
  )

  return (
    <div className="p-4">
      {isHostedReadonly ? (
        <>
          {deviceStatusPanels}
          <HostedGen2Measurements
            rows={hostedGen2Rows}
            isLoading={isHostedGen2Loading}
            error={hostedGen2Error}
            fallbackDeviceLabel={selectedDeviceLabel}
          />
          <HostedGen2TrendChart
            rows={hostedGen2Rows}
            isLoading={isHostedGen2Loading}
            error={hostedGen2Error}
            controls={historyControls}
          />
        </>
      ) : (
        <>
          {sensorHistoryHeader}
          {deviceStatusPanels}
          {sensorHistoryChart}
        </>
      )}
    </div>
  )
}

export default SensorLogViewer
