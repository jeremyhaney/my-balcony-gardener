import React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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
  watering: boolean
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
    timestamp: log.timestamp,
    timestampMs: new Date(log.timestamp).getTime(),
    temperature: log.temperature,
    humidity: log.humidity,
    moisture: log.moisture,
    watering: log.watering,
  }))
  const wateringEvents = data.filter((point) => point.watering === true)
  const formatTime = (timestampMs: number) =>
    new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formatDateTime = (timestampMs: number) =>
    new Date(timestampMs).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

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
          <XAxis
            dataKey="timestampMs"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
          />
          <YAxis
            yAxisId="left"
            domain={[30, 100]}
            label={{
              value: 'Temp (\u00B0F)',
              angle: -90,
              position: 'insideLeft',
              fill: '#ff7300',
            }}
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
          <Tooltip labelFormatter={(label) => formatDateTime(Number(label))} />
          <Legend />
          {wateringEvents.map((event) => (
            <ReferenceLine
              key={event.timestamp}
              yAxisId="left"
              x={event.timestampMs}
              stroke="#0f766e"
              strokeDasharray="6 3"
              strokeOpacity={0.65}
              strokeWidth={2}
              label={{
                value: 'Watering',
                position: 'top',
                fill: '#0f766e',
                fontSize: 12,
                fontWeight: 700,
              }}
            />
          ))}
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
