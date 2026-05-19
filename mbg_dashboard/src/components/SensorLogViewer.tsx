import { type ChangeEvent, useEffect, useState } from 'react'
import { fetchHistoryLogs } from '../api'
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
import { calculateTelemetryHealth } from '../telemetryHealth'
import type { SensorLogRow } from '../types/sensorLog'
import DualAxisChart from './DualAxisChart'
import SensorHealthPanel from './SensorHealthPanel'

const isValidPercent = (value: number): boolean =>
  Number.isFinite(value) && value >= 0 && value <= 100

const sanitizePercent = (value: number): number | null => (isValidPercent(value) ? value : null)

const hasUsableTimestamp = (timestamp: string): boolean =>
  Number.isFinite(new Date(timestamp).getTime())

const HISTORY_REFRESH_INTERVAL_MS = 10000

const SensorLogViewer = () => {
  const [logs, setLogs] = useState<SensorLogRow[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
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
      const { rows, error } = await fetchHistoryLogs(
        selectedWindow.limit,
        selectedDevice.deviceId,
        lowerBoundIso,
      )

      if (!isMounted) {
        return
      }

      setLogs(rows)
      setHistoryError(error)
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
  }, [selectedDevice, selectedWindow])

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

  const telemetryHealth = isLoading ? null : calculateTelemetryHealth(logs, selectedWindow.key)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Sensor History</h2>

      <div
        aria-label="Sensor history controls"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'flex-end',
          marginBottom: '1rem',
        }}
      >
        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
          <span>History Device</span>
          <select
            value={selectedDevice.key}
            onChange={handleDeviceChange}
            style={{ minWidth: '220px', padding: '0.4rem' }}
          >
            {HISTORY_DEVICE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
          <span>Window</span>
          <select
            value={selectedWindow.key}
            onChange={handleWindowChange}
            style={{ minWidth: '160px', padding: '0.4rem' }}
          >
            {HISTORY_WINDOW_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-3 text-sm">
        Showing history for {selectedDevice.label} ({selectedDevice.role}) for{' '}
        {selectedWindow.label}. {selectedDevice.description}
      </p>

      {historyError ? (
        <p className="mb-3 text-sm" style={{ color: '#7f1d1d' }}>
          {historyError}
        </p>
      ) : null}

      {telemetryHealth ? <SensorHealthPanel health={telemetryHealth} /> : null}

      {isLoading ? (
        <p className="text-sm">Loading history...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm">No history available yet.</p>
      ) : chartLogs.length === 0 ? (
        <p className="text-sm">History rows were found, but no valid readings are available to chart yet.</p>
      ) : (
        <DualAxisChart sensorLogs={chartLogs} historyWindowKey={selectedWindow.key} />
      )}
    </div>
  )
}

export default SensorLogViewer
