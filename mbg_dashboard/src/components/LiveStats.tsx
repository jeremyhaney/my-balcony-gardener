// src/components/LiveStats.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import DualAxisChart from './DualAxisChart';

interface LogEntry {
  id?: string;
  timestamp: string;
  data: {
    temperature: number;
    humidity: number;
    moisture: number;
    duration: number;
    lastWateredTime: string;
    lastWateringDuration: number;
    watering: boolean;
  };
}

const WATER_ENDPOINT = import.meta.env.VITE_WATER_ENDPOINT || "http://10.0.0.192/water";

const LiveStats = () => {
  const [latest, setLatest] = useState<LogEntry | null>(null);
  const [sensorLogs, setSensorLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('id, timestamp, data')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setLatest(data[0]);
        setError(null);
      } else {
        setError('No data available from Supabase.');
      }
    } catch (err: any) {
      console.warn('Supabase fetch failed. Falling back to /api/latest.', err.message);
      fetchFromFallback();
    }
  };

  const fetchLogHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('id, timestamp, data')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data && data.length > 0) {
        setSensorLogs(data.reverse());
      }
    } catch (err: any) {
      console.error('Error fetching log history:', err.message);
    }
  };

  const fetchFromFallback = async () => {
    try {
      const response = await fetch('/api/latest');
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setLatest(data);
      setError(null);
    } catch (err: any) {
      console.error('Fallback fetch also failed:', err.message);
      setError('Unable to fetch data from Supabase or local API.');
    }
  };

  useEffect(() => {
    fetchFromSupabase();
    fetchLogHistory();
    const interval = setInterval(() => {
      fetchFromSupabase();
      fetchLogHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!latest) return <div>Loading live stats...</div>;

  const {
    temperature,
    humidity,
    moisture,
    duration,
    lastWateredTime,
    lastWateringDuration,
    watering,
  } = latest.data;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          textAlign: 'center',
        }}
      >
        <div>🌡️ <strong>Temp:</strong> {temperature.toFixed(1)} °F</div>
        <div>💧 <strong>Humidity:</strong> {humidity.toFixed(1)} %</div>
        <div>🌴 <strong>Soil Moisture:</strong> {moisture.toFixed(1)}%</div>
        <div>🕒 <strong>Duration:</strong> {(duration / 1000).toFixed(1)}s</div>
        <div>⏱️ <strong>Last Watering Duration:</strong> {lastWateringDuration.toFixed(1)}s</div>
        <div>🚿 <strong>Last Watered:</strong> {lastWateredTime}</div>
        <div>📅 <strong>Log Time:</strong> {new Date(latest.timestamp).toLocaleString()}</div>
        <div>🔄 <strong>Currently Watering:</strong> {watering ? 'Yes' : 'No'}</div>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          onClick={async () => {
            try {
              const response = await fetch(WATER_ENDPOINT);
              if (response.ok) {
                alert("🚿 Manual watering triggered!");
              } else {
                alert("⚠️ Watering request failed.");
              }
            } catch (err) {
              console.error("Error triggering water:", err);
              alert("⚠️ Unable to reach ESP32.");
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          💧 Water Now
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ textAlign: "center" }}>📈 Sensor Trends</h3>
        <DualAxisChart
          sensorLogs={sensorLogs.map(log => ({
            timestamp: log.timestamp,
            temperature: log.data.temperature,
            humidity: log.data.humidity,
            moisture: log.data.moisture,
          }))}
        />
      </div>
    </>
  );
};

export default LiveStats;
