// src/components/LiveStats.tsx
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import DualAxisChart from './DualAxisChart';
import styles from './LiveStats.module.css';

interface SensorLog {
  timestamp: string;
  temperature: number;
  humidity: number;
  moisture: number;
  watering: boolean;
}

interface SensorData {
  temperature: number;
  humidity: number;
  moisture: number;
  watering: boolean;
  lastWateredTime?: string;
  lastWateringDuration?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  data: SensorData;
}

const WATER_ENDPOINT = '/water-now';

const LiveStats = () => {
  const [latest, setLatest] = useState<LogEntry | null>(null);
  const [sensorLogs, setSensorLogs] = useState<SensorLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isWatering, setIsWatering] = useState(false);

  // Check if data is stale (older than 1 minute)
  const checkDataFreshness = useCallback((timestamp: string): boolean => {
    const lastUpdate = new Date(timestamp).getTime();
    const now = new Date().getTime();
    return (now - lastUpdate) > 60000; // 1 minute
  }, []);

  // Fetch data from fallback endpoint
  const fetchFromFallback = useCallback(async (): Promise<LogEntry | null> => {
    try {
      const response = await fetch('/logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      return null;
    } catch (err) {
      console.error('Error fetching from fallback:', err);
      throw err;
    }
  }, []);

  // Fetch historical data for the chart
  const fetchHistoricalData = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(24); // Last 24 readings

      if (error) throw error;
      if (data) {
        setSensorLogs(data);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  }, []);

  // Fetch data from Supabase
  const fetchFromSupabase = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setLatest(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching from Supabase:', err);
      // Fall back to local endpoint if Supabase fails
      try {
        const fallbackData = await fetchFromFallback();
        if (fallbackData) {
          setLatest(fallbackData);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError);
        setError('Failed to fetch data from both Supabase and fallback source');
      }
    }
  }, [fetchFromFallback]);

  // Set up polling
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchFromSupabase(),
          fetchHistoricalData()
        ]);
        
        if (latest?.timestamp) {
          setIsStale(checkDataFreshness(latest.timestamp));
        }
      } catch (err) {
        console.error('Error in fetchAllData:', err);
      }
    };

    // Initial data fetch
    fetchAllData();
    
    // Set up polling for latest data
    const interval = setInterval(() => {
      if (isMounted) {
        fetchFromSupabase();
        // Only fetch historical data every 30 seconds to reduce load
        if (Date.now() % 30000 < 5000) {
          fetchHistoricalData();
        }
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchFromSupabase, fetchHistoricalData, checkDataFreshness, latest?.timestamp]);

  const formatTime = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleWaterNow = async () => {
    if (isWatering) return;

    setIsWatering(true);
    try {
      const response = await fetch(WATER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to trigger watering');
      }

      // Refresh data after a short delay to allow for watering to start
      setTimeout(() => {
        fetchFromSupabase().finally(() => setIsWatering(false));
      }, 1000);
    } catch (err) {
      console.error('Error triggering watering:', err);
      setError('Failed to trigger watering. Please try again.');
      setIsWatering(false);
    }
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        Error: {error}
      </div>
    );
  }

  if (!latest) {
    return (
      <div className={styles.loadingContainer}>
        Loading sensor data...
      </div>
    );
  }

  const { temperature, humidity, moisture, watering, lastWateredTime, lastWateringDuration = 0 } = latest.data;
  const formattedLastWatered = formatTime(lastWateredTime);
  const lastUpdated = formatTime(latest.timestamp);

  return (
    <div className={styles.container}>
      <div className={styles.liveIndicator}>
        <div>
          <span className={`${styles.dot} ${isStale ? styles.stale : ''}`}></span>
          <span>{isStale ? 'Data Stale' : 'Live'}</span>
        </div>
        <div className={styles.lastUpdated}>
          Last updated: {lastUpdated}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>🌡️ <strong>Temperature:</strong> {temperature.toFixed(1)}°F</div>
        <div className={styles.statCard}>💧 <strong>Humidity:</strong> {humidity.toFixed(1)}%</div>
        <div className={styles.statCard}>🌴 <strong>Soil Moisture:</strong> {moisture.toFixed(1)}%</div>
        <div className={styles.statCard}>
          <div>⏱️ <strong>Last Watering:</strong> {lastWateringDuration.toFixed(1)}s</div>
          <div>🚿 <strong>Last Watered:</strong> {formattedLastWatered}</div>
        </div>
        <div className={styles.statCard}>🔄 <strong>Status:</strong> {watering ? 'Watering...' : 'Idle'}</div>
      </div>

      <div className={styles.waterButtonContainer}>
        <button
          className={styles.waterButton}
          onClick={handleWaterNow}
          disabled={isWatering || watering}
        >
          {isWatering || watering ? 'Watering...' : '💧 Water Now'}
        </button>
      </div>

      <div className={styles.chartContainer}>
        <h3>Sensor History</h3>
        <DualAxisChart sensorLogs={sensorLogs} isStale={isStale} />
      </div>
    </div>
  );
};

export default LiveStats;
