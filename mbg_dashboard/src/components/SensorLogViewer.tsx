import { useEffect, useState } from 'react'
import { fetchHistoryLogs } from '../api'
import type { SensorLogRow } from '../types/sensorLog'
import DualAxisChart from './DualAxisChart'

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

    return () => {
      isMounted = false
    }
  }, [])

  const chartLogs = [...logs]
    .reverse()
    .map((log) => ({
      timestamp: log.timestamp,
      temperature: log.data.temperature,
      humidity: log.data.humidity,
      moisture: log.data.moisture,
    }))

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
      ) : (
        <>
          <DualAxisChart sensorLogs={chartLogs} />
          <ul className="mt-4 text-sm space-y-1">
            {logs.map((log) => (
              <li key={log.id ?? `${log.device_id}-${log.timestamp}`} className="border-b pb-1">
                Temp: {log.data.temperature}Â°F | Hum: {log.data.humidity}% | Moist:{' '}
                {log.data.moisture}% | Watering: {log.data.watering ? 'Yes' : 'No'} | Duration:{' '}
                {log.data.lastWateringDuration} s | Time: {new Date(log.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default SensorLogViewer
