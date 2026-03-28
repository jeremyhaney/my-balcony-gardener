import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import React from "react";

interface SensorLog {
  timestamp: string;
  temperature: number;
  humidity: number;
  moisture: number;
}

interface Props {
  sensorLogs: SensorLog[];
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
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" domain={[30, 100]} label={{ value: "Temp (Â°F)", angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: "Humidity / Moisture (%)", angle: 90, position: "insideRight" }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff7300" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#8884d8" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="moisture" stroke="#82ca9d" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DualAxisChart;
