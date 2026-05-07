import { useEffect, useState } from 'react'
import { fetchHistoryLogs } from '../api'
import type { SensorLogRow } from '../types/sensorLog'
import DualAxisChart from './DualAxisChart'

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

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      const { rows, error } = await fetchHistoryLogs(20)

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
  }, [])

  const chartLogs = [...logs]
    .reverse()
    .map((log) => {
      const temperature = Number.isFinite(log.data.temperature) ? log.data.temperature : null
      const humidity = sanitizePercent(log.data.humidity)
      const moisture = sanitizePercent(log.data.moisture)

      return {
        timestamp: log.timestamp,
        temperature,
        humidity,
        moisture,
      }
    })
    .filter(
      (log) =>
        hasUsableTimestamp(log.timestamp) &&
        (log.temperature !== null || log.humidity !== null || log.moisture !== null)
    )

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Sensor History</h2>

      {historyError ? (
        <p className="mb-3 text-sm" style={{ color: '#7f1d1d' }}>
          {historyError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm">Loading history...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm">No history available yet.</p>
      ) : chartLogs.length === 0 ? (
        <p className="text-sm">History rows were found, but no valid readings are available to chart yet.</p>
      ) : (
        <DualAxisChart sensorLogs={chartLogs} />
      )}
    </div>
  )
}

export default SensorLogViewer
