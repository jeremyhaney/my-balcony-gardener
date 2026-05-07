import React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface SensorLog {
  timestamp: string
  temperature: number | null
  humidity: number | null
  moisture: number | null
}

interface Props {
  sensorLogs: SensorLog[]
}

const DualAxisChart: React.FC<Props> = ({ sensorLogs }) => {
  if (sensorLogs.length === 0) {
    return (
      <div style={{ width: '100%', padding: '1rem', textAlign: 'center' }}>
        No chart history available.
      </div>
    )
  }

  const data = sensorLogs.map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: log.temperature,
    humidity: log.humidity,
    moisture: log.moisture,
  }))

  return (
    <div
      style={{
        width: '100%',
        height: 340,
        backgroundColor: '#ffffff',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 70, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis
            yAxisId="left"
            domain={[30, 100]}
            label={{ value: 'Temp (\u00B0F)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            label={{
              value: 'Humidity / Moisture (%)',
              angle: 90,
              position: 'insideRight',
              dx: 18,
              style: { textAnchor: 'middle' },
            }}
          />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#ff7300"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="humidity"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="moisture"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DualAxisChart
