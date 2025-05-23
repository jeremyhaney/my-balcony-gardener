import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type LogEntry = {
  id: string
  device_id: string
  timestamp: string
  data: {
    temperature: number
    humidity: number
    moisture: number
    watered: boolean
    duration: number
  }
}

const SensorLogViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])

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
        setLogs(data as LogEntry[])
      }
    }

    fetchLogs()
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Latest Sensor Logs</h2>
      <ul className="text-sm space-y-1">
        {logs.map(log => (
          <li key={log.id} className="border-b pb-1">
            🌡️ Temp: {log.data.temperature}°F | 💧 Hum: {log.data.humidity}% | 🌱 Moist: {log.data.moisture}% |
            💦 Watered: {log.data.watered ? 'Yes' : 'No'} | ⏱️ {log.data.duration} ms | 🕒 {new Date(log.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SensorLogViewer
