// src/components/LiveStats.tsx
import { useEffect, useState } from 'react';
import type { SensorData, SensorLogRow } from '../types/sensorLog';

type FallbackSensorLogRow = Omit<SensorLogRow, 'id'>;

const DEFAULT_SENSOR_DATA: SensorData = {
  temperature: 0,
  humidity: 0,
  moisture: 0,
  watering: false,
  lastWateredTime: 'Never',
  lastWateringDuration: 0,
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

const finiteNumberOrUndefined = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const formatDisplayDateTime = (value: string): string => {
  if (!value || value.trim() === '' || value === 'Never') {
    return 'Never';
  }

  const parsedValue = new Date(value);

  return Number.isNaN(parsedValue.getTime()) ? value : parsedValue.toLocaleString();
};

const getEsp32BaseUrl = () => {
  const legacyWaterEndpoint = import.meta.env.VITE_WATER_ENDPOINT;
  const baseUrl =
    import.meta.env.VITE_ESP32_URL ||
    (legacyWaterEndpoint ? legacyWaterEndpoint.replace(/\/water-now\/?$/, '') : undefined) ||
    'http://10.0.0.200';

  return baseUrl.replace(/\/$/, '');
};

const WATER_ENDPOINT = `${getEsp32BaseUrl()}/water-now`;

const LiveStats = () => {
  const [latest, setLatest] = useState<SensorLogRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFromFallback = async () => {
      try {
        const response = await fetch('/logs');
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = (await response.json()) as Partial<FallbackSensorLogRow>;
        const transformedData: SensorLogRow = {
          device_id: data.device_id ?? '',
          timestamp: data.timestamp ?? new Date().toISOString(),
          data: {
            temperature: data.data?.temperature ?? DEFAULT_SENSOR_DATA.temperature,
            humidity: data.data?.humidity ?? DEFAULT_SENSOR_DATA.humidity,
            moisture: data.data?.moisture ?? DEFAULT_SENSOR_DATA.moisture,
            soilRawAdc: finiteNumberOrUndefined(data.data?.soilRawAdc),
            watering: data.data?.watering ?? DEFAULT_SENSOR_DATA.watering,
            lastWateredTime: data.data?.lastWateredTime ?? DEFAULT_SENSOR_DATA.lastWateredTime,
            lastWateringDuration:
              data.data?.lastWateringDuration ?? DEFAULT_SENSOR_DATA.lastWateringDuration,
          },
        };

        if (isMounted) {
          setLatest(transformedData);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Fallback fetch also failed:', getErrorMessage(err));
          setError('Unable to fetch data from local ESP32 API.');
        }
      }
    };

    void fetchFromFallback();

    const interval = setInterval(() => {
      if (isMounted) {
        void fetchFromFallback();
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

  const sensorData = latest.data ?? DEFAULT_SENSOR_DATA;

  // Extract values from the nested data structure
  const {
    temperature = 0,
    humidity = 0,
    moisture = 0,
    soilRawAdc,
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
        {Number.isFinite(soilRawAdc) && (
          <div><strong>Raw Soil ADC:</strong> {soilRawAdc}</div>
        )}
        <div>⏱️ <strong>Last Watering Duration:</strong> {lastWateringDuration.toFixed(1)}s</div>
        <div>🚿 <strong>Last Watered:</strong> {formatDisplayDateTime(lastWateredTime)}</div>
        <div>📅 <strong>Log Time:</strong> {new Date(latest.timestamp).toLocaleString()}</div>
        <div>🔄 <strong>Currently Watering:</strong> {watering ? 'Yes' : 'No'}</div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={async () => {
            try {
              const response = await fetch(WATER_ENDPOINT, { method: 'POST' });
              if (response.ok) {
                alert('🚿 Manual watering triggered!');
              } else {
                alert('⚠️ Watering request failed.');
              }
            } catch (err) {
              console.error('Error triggering water:', err);
              alert('⚠️ Unable to reach ESP32.');
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          💧 Water Now
        </button>
      </div>
    </>
  );
};

export default LiveStats;
