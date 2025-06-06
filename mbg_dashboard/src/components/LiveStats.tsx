// src/components/LiveStats.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import DualAxisChart from './DualAxisChart';

interface LogEntry {
  id?: string;
  device_id?: string;
  timestamp: string;
  data: {
    temperature: number;
    humidity: number;
    moisture: number;
    watering: boolean;
    lastWateredTime: string;
    lastWateringDuration: number;
  };
}

const WATER_ENDPOINT = import.meta.env.VITE_WATER_ENDPOINT || "http://10.0.0.192/water-now";

const LiveStats = () => {
  const [latest, setLatest] = useState<LogEntry | null>(null);
  const [sensorLogs, setSensorLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('*')
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
      console.warn('Supabase fetch failed. Falling back to /logs.', err.message);
      fetchFromFallback();
    }
  };

  const fetchLogHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('*')
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
      const response = await fetch('/logs');
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      
      // Transform local API data to match Supabase format if needed
      const transformedData = {
        timestamp: data.timestamp || new Date().toISOString(),
        data: {
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          moisture: data.moisture || 0,
          watering: data.watering || false,
          lastWateredTime: data.lastWateredTime || 'Never',
          lastWateringDuration: data.lastWateringDuration || 0
        }
      };
      
      setLatest(transformedData);
      setError(null);
    } catch (err: any) {
      console.error('Fallback fetch also failed:', err.message);
      setError('Unable to fetch data from Supabase or local API.');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        await Promise.all([fetchFromSupabase(), fetchLogHistory()]);
      } catch (err) {
        if (isMounted) {
          console.error('Error in initial data fetch:', err);
          setError('Failed to load initial data. Check console for details.');
        }
      }
    };

    fetchData();

    const interval = setInterval(() => {
      if (isMounted) {
        fetchFromSupabase().catch(console.error);
        fetchLogHistory().catch(console.error);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return (
      <div style={{ 
        color: 'red', 
        padding: '1rem',
        backgroundColor: '#ffebee',
        borderRadius: '4px',
        margin: '1rem 0'
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }
  
  if (!latest) {
    return (
      <div style={{ 
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        margin: '1rem 0',
        textAlign: 'center'
      }}>
        Loading live stats...
      </div>
    );
  }

  // Safely destructure with defaults to prevent runtime errors
  const {
    data: sensorData = {
      temperature: 0,
      humidity: 0,
      moisture: 0,
      watering: false,
      lastWateredTime: 'Never',
      lastWateringDuration: 0,
    }
  } = latest || {};

  // Extract values from the nested data structure
  const {
    temperature = 0,
    humidity = 0,
    moisture = 0,
    watering = false,
    lastWateredTime = 'Never',
    lastWateringDuration = 0,
  } = sensorData;

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
        <div>⏱️ <strong>Last Watering Duration:</strong> {lastWateringDuration.toFixed(1)}s</div>
        <div>🚿 <strong>Last Watered:</strong> {lastWateredTime}</div>
        <div>📅 <strong>Log Time:</strong> {new Date(latest.timestamp).toLocaleString()}</div>
        <div>🔄 <strong>Currently Watering:</strong> {watering ? 'Yes' : 'No'}</div>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          onClick={async () => {
            try {
              const response = await fetch(WATER_ENDPOINT, { method: 'POST' });
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
            timestamp: log?.timestamp || new Date().toISOString(),
            temperature: log?.data?.temperature || 0,
            humidity: log?.data?.humidity || 0,
            moisture: log?.data?.moisture || 0,
          }))}
        />
      </div>
    </>
  );
};

export default LiveStats;
