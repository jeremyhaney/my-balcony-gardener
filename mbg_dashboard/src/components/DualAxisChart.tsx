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
  isStale?: boolean;
}

const DualAxisChart: React.FC<Props> = ({ sensorLogs, isStale = false }) => {
  const data = sensorLogs.map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: log.temperature,
    humidity: log.humidity,
    moisture: log.moisture,
  }));

  // Calculate dynamic temperature range based on current data
  const tempMin = Math.floor(Math.min(...data.map(d => d.temperature)) - 5);
  const tempMax = Math.ceil(Math.max(...data.map(d => d.temperature)) + 5);
  const tempDomain = [Math.max(-10, tempMin), Math.min(120, tempMax)];

  return (
    <div style={{ 
      width: "100%", 
      height: 300,
      opacity: isStale ? 0.5 : 1,
      transition: "opacity 0.3s ease-in-out"
    }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E0E0E0"
            opacity={0.5}
          />
          <XAxis 
            dataKey="time"
            stroke="#795548"
            tick={{ fill: "#795548", fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            domain={tempDomain}
            label={{ 
              value: "Temp (°F)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#ff7300" }
            }}
            stroke="#ff7300"
            tick={{ fill: "#ff7300", fontSize: 12 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            label={{ 
              value: "Humidity / Moisture (%)",
              angle: 90,
              position: "outsideRight",
              offset: 25,
              style: { 
                fill: "#8884d8",
                fontSize: 12,
                fontWeight: 500,
                textAnchor: 'middle'
              }
            }}
            stroke="#8884d8"
            tick={{ fill: "#8884d8", fontSize: 12 }}
            width={80}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #E0E0E0",
              borderRadius: "4px"
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: "10px"
            }}
          />
          <Line 
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#ff7300"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={300}
          />
          <Line 
            yAxisId="right"
            type="monotone"
            dataKey="humidity"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={300}
          />
          <Line 
            yAxisId="right"
            type="monotone"
            dataKey="moisture"
            name="Moisture"
            stroke="#FF8C00"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={!isStale}
            opacity={isStale ? 0.6 : 1}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DualAxisChart;
