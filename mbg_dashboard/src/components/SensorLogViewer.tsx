import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { SensorLogRow } from '../types/sensorLog'

const SensorLogViewer = () => {
  const [logs, setLogs] = useState<SensorLogRow[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching logs:', error)
      } else {
        setLogs((data ?? []) as SensorLogRow[])
      }
    }

    void fetchLogs()
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Latest Sensor Logs</h2>
      <ul className="text-sm space-y-1">
        {logs.map((log) => (
          <li key={log.id ?? `${log.device_id}-${log.timestamp}`} className="border-b pb-1">
            Temp: {log.data.temperature}°F | Hum: {log.data.humidity}% | Moist: {log.data.moisture}% |
            Watering: {log.data.watering ? 'Yes' : 'No'} | Duration: {log.data.lastWateringDuration} s | Time:{' '}
            {new Date(log.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SensorLogViewer
