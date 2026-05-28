import { useEffect, useMemo, useState } from 'react'
import { DEVICE_REGISTRY } from '../deviceRegistry'
import {
  fetchLocalCapabilities,
  fetchLocalMeasurements,
  fetchLocalStatus,
  postLocalWaterNow,
} from '../liveMeasurementsApi'
import { LOCAL_CONTROL_TARGETS } from '../localControlTargets'
import type {
  CapabilitiesResponse,
  LocalStatusResponse,
  MeasurementRecord,
  MeasurementsResponse,
} from '../types/liveMeasurements'
import './LiveMeasurements.css'

const REFRESH_INTERVAL_MS = 5000
const DEFAULT_TARGET_KEY = 'bench'
const BENCH_WATER_NOW_WARNING =
  'Bench simulation: no pump attached.'

type LoadState = {
  status: LocalStatusResponse | null
  capabilities: CapabilitiesResponse | null
  measurements: MeasurementsResponse | null
  error: string | null
  isLoading: boolean
}

type PrimaryReading = {
  label: string
  measurementName: string
  sensorKey?: string
}

const PRIMARY_READINGS: PrimaryReading[] = [
  {
    label: 'Air Temperature',
    measurementName: 'air_temperature',
    sensorKey: 'bme280_air',
  },
  {
    label: 'Humidity',
    measurementName: 'relative_humidity',
    sensorKey: 'bme280_air',
  },
  {
    label: 'Temperature Probe',
    measurementName: 'temperature',
    sensorKey: 'ds18b20_temperature',
  },
  {
    label: 'Light Level',
    measurementName: 'ambient_light',
    sensorKey: 'veml6030_light',
  },
  {
    label: 'Soil Moisture Index',
    measurementName: 'moisture_index',
    sensorKey: 'soil_moisture_analog',
  },
  {
    label: 'Barometric Pressure',
    measurementName: 'barometric_pressure',
    sensorKey: 'bme280_air',
  },
]

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error'

const formatBoolean = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  return value ? 'Yes' : 'No'
}

const formatNumber = (value: number | null | undefined, unit = ''): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Not available'
  }

  return `${value.toLocaleString()}${unit}`
}

const formatBytes = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value < 0 || !Number.isFinite(value)) {
    return 'Not available'
  }

  return `${Math.round(value / 1024).toLocaleString()} KB`
}

const formatDurationSeconds = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value < 0 || !Number.isFinite(value)) {
    return 'Not available'
  }

  const totalSeconds = Math.round(value)

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`
  }

  const totalMinutes = Math.round(totalSeconds / 60)

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const totalHours = Math.round(totalMinutes / 60)

  if (totalHours < 48) {
    return `${totalHours} hr`
  }

  return `${Math.round(totalHours / 24)} days`
}

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available'
  }

  const parsedValue = new Date(value)

  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : value
}

const formatMeasurementValue = (record: MeasurementRecord): string => {
  if (record.measurement_value === null || !Number.isFinite(record.measurement_value)) {
    return 'Not available'
  }

  return `${record.measurement_value.toLocaleString()} ${record.measurement_unit}`.trim()
}

const findMeasurementRecord = (
  records: MeasurementRecord[],
  reading: PrimaryReading,
): MeasurementRecord | undefined =>
  records.find(
    (record) =>
      record.measurement_name === reading.measurementName &&
      (!reading.sensorKey || record.sensor_key === reading.sensorKey),
  )

const groupMeasurementsBySensor = (records: MeasurementRecord[]) =>
  records.reduce<Record<string, MeasurementRecord[]>>((groups, record) => {
    const key = record.sensor_key || 'unknown_sensor'
    groups[key] = [...(groups[key] ?? []), record]
    return groups
  }, {})

const detailsJson = (details: Record<string, unknown>): string =>
  JSON.stringify(details ?? {}, null, 2)

const getConnectionStatus = (loadState: LoadState): string => {
  if (loadState.isLoading) {
    return 'Loading'
  }

  if (loadState.error) {
    return 'Needs attention'
  }

  if (loadState.status?.wifi_connected === true) {
    return 'Online'
  }

  if (loadState.status?.wifi_connected === false) {
    return 'Offline'
  }

  return 'Waiting for device'
}

const localTarget = LOCAL_CONTROL_TARGETS.find((target) => target.deviceKey === DEFAULT_TARGET_KEY)
const registeredDevice = DEVICE_REGISTRY.find((device) => device.key === DEFAULT_TARGET_KEY)

const LiveMeasurements = () => {
  const [loadState, setLoadState] = useState<LoadState>({
    status: null,
    capabilities: null,
    measurements: null,
    error: null,
    isLoading: true,
  })
  const [waterNowStatus, setWaterNowStatus] = useState<string | null>(null)

  const baseUrl = localTarget ? `http://${localTarget.expectedLocalIp}` : ''

  useEffect(() => {
    let isMounted = true

    const loadLiveMeasurements = async () => {
      if (!baseUrl) {
        setLoadState({
          status: null,
          capabilities: null,
          measurements: null,
          error: 'Bench local target is not configured.',
          isLoading: false,
        })
        return
      }

      try {
        const [status, capabilities, measurements] = await Promise.all([
          fetchLocalStatus(baseUrl),
          fetchLocalCapabilities(baseUrl),
          fetchLocalMeasurements(baseUrl),
        ])

        if (!isMounted) {
          return
        }

        setLoadState({
          status,
          capabilities,
          measurements,
          error: null,
          isLoading: false,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setLoadState((previousState) => ({
          ...previousState,
          error: `Live Measurements unavailable: ${getErrorMessage(error)}`,
          isLoading: false,
        }))
      }
    }

    void loadLiveMeasurements()

    const refreshTimer = window.setInterval(() => {
      void loadLiveMeasurements()
    }, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
    }
  }, [baseUrl])

  const measurementGroups = useMemo(
    () => groupMeasurementsBySensor(loadState.measurements?.records ?? []),
    [loadState.measurements],
  )

  const handleWaterNow = async () => {
    if (!baseUrl) {
      return
    }

    setWaterNowStatus('Sending Water Now...')

    try {
      await postLocalWaterNow(baseUrl)
      setWaterNowStatus('Water Now accepted by bench firmware.')
    } catch (error) {
      setWaterNowStatus(`Water Now failed: ${getErrorMessage(error)}`)
    }
  }

  const status = loadState.status
  const capabilities = loadState.capabilities
  const measurements = loadState.measurements
  const records = measurements?.records ?? []
  const connectionStatus = getConnectionStatus(loadState)
  const readingCards = PRIMARY_READINGS.map((reading) => ({
    ...reading,
    record: findMeasurementRecord(records, reading),
  }))

  return (
    <section className="live-measurements" aria-label="Live Measurements">
      <div className="live-measurements-header">
        <div>
          <h2>Live Measurements</h2>
          <p>{registeredDevice?.label ?? 'Bench unit'}</p>
          <p className="live-measurements-updated">
            Last updated {formatTimestamp(measurements?.measured_at)}
          </p>
        </div>

        <span
          className={`live-measurements-status live-measurements-status-${connectionStatus
            .toLowerCase()
            .replace(/\s+/g, '-')}`}
        >
          {connectionStatus}
        </span>
      </div>

      {loadState.error ? <p className="live-measurements-error">{loadState.error}</p> : null}

      {loadState.isLoading ? <p>Loading Live Measurements...</p> : null}

      <div className="live-measurements-reading-grid">
        {readingCards.map((reading) => (
          <article className="live-measurements-reading-card" key={reading.measurementName}>
            <h3>{reading.label}</h3>
            <p className="live-measurements-reading-value">
              {reading.record ? formatMeasurementValue(reading.record) : 'Not available'}
            </p>
            <p className="live-measurements-reading-state">
              {reading.record?.valid === false
                ? 'Reading needs attention'
                : reading.record
                  ? 'Latest reading'
                  : 'Waiting for reading'}
            </p>
          </article>
        ))}
      </div>

      <p className="live-measurements-note">
        These readings are display/diagnostic only and are not controlling watering yet.
      </p>

      <div className="live-measurements-water-now">
        <div>
          <h3>Water Now</h3>
          <p className="live-measurements-warning">{BENCH_WATER_NOW_WARNING}</p>
          {waterNowStatus ? <p>{waterNowStatus}</p> : null}
        </div>

        <button
          className="live-measurements-action"
          type="button"
          onClick={handleWaterNow}
          disabled={!baseUrl}
        >
          Water Now
        </button>
      </div>

      <details className="live-measurements-advanced">
        <summary>Advanced details</summary>

        <section className="live-measurements-advanced-section">
          <h3>Device technical diagnostics</h3>
          <div className="live-measurements-panel">
            <dl className="live-measurements-facts">
              <dt>Device ID</dt>
              <dd>{status?.device_id ?? capabilities?.device_id ?? measurements?.device_id ?? 'Not available'}</dd>

              <dt>Base URL</dt>
              <dd>{baseUrl || 'Not available'}</dd>

              <dt>IP address</dt>
              <dd>{status?.ip_address ?? localTarget?.expectedLocalIp ?? 'Not available'}</dd>

              <dt>RSSI</dt>
              <dd>{formatNumber(status?.wifi_rssi, ' dBm')}</dd>

              <dt>Uptime</dt>
              <dd>{formatDurationSeconds(status?.uptime_seconds)}</dd>

              <dt>Free heap</dt>
              <dd>{formatBytes(status?.free_heap)}</dd>

              <dt>Minimum free heap</dt>
              <dd>{formatBytes(status?.min_free_heap)}</dd>

              <dt>Watering now</dt>
              <dd>{formatBoolean(status?.currently_watering)}</dd>

              <dt>Watering output pin</dt>
              <dd>{formatNumber(capabilities?.relay_test_output_pin)}</dd>

              <dt>I2C SDA</dt>
              <dd>{formatNumber(capabilities?.i2c?.sda_pin)}</dd>

              <dt>I2C SCL</dt>
              <dd>{formatNumber(capabilities?.i2c?.scl_pin)}</dd>

              <dt>I2C addresses</dt>
              <dd>{capabilities?.i2c_scan?.addresses_found?.join(', ') || 'None reported'}</dd>
            </dl>
          </div>
        </section>

        <section className="live-measurements-advanced-section">
          <h3>Sensor module details</h3>

          {capabilities?.modules?.length ? (
            <div className="live-measurements-modules">
              {capabilities.modules.map((module) => (
                <div className="live-measurements-module" key={module.sensor_key}>
                  <dl className="live-measurements-facts">
                    <dt>Sensor key</dt>
                    <dd>{module.sensor_key}</dd>

                    <dt>Type</dt>
                    <dd>{module.sensor_type}</dd>

                    <dt>Enabled</dt>
                    <dd>{formatBoolean(module.enabled)}</dd>

                    <dt>Present</dt>
                    <dd>{formatBoolean(module.present)}</dd>

                    <dt>Quality</dt>
                    <dd>{module.quality || 'Not available'}</dd>

                    <dt>Reason</dt>
                    <dd>{module.reason || 'Not available'}</dd>

                    <dt>Control eligible</dt>
                    <dd>{formatBoolean(module.control_eligible)}</dd>
                  </dl>

                  <details className="live-measurements-details">
                    <summary>Details</summary>
                    <pre>{detailsJson(module.details)}</pre>
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <p>No modules reported yet.</p>
          )}
        </section>

        <section className="live-measurements-advanced-section">
          <h3>Raw measurement records</h3>
          <p>Measured at {formatTimestamp(measurements?.measured_at)}</p>

          {Object.entries(measurementGroups).length > 0 ? (
            Object.entries(measurementGroups).map(([sensorKey, records]) => (
              <div className="live-measurements-sensor-group" key={sensorKey}>
                <div className="live-measurements-sensor-heading">{sensorKey}</div>

                {records.map((record) => (
                  <div
                    className="live-measurements-record"
                    key={`${record.sensor_key}-${record.measurement_name}`}
                  >
                    <dl className="live-measurements-record-list">
                      <dt>Name</dt>
                      <dd>{record.measurement_name}</dd>

                      <dt>Value</dt>
                      <dd>{formatMeasurementValue(record)}</dd>

                      <dt>Unit</dt>
                      <dd>{record.measurement_unit || 'Not available'}</dd>

                      <dt>Valid</dt>
                      <dd>{formatBoolean(record.valid)}</dd>

                      <dt>Quality</dt>
                      <dd>{record.quality || 'Not available'}</dd>

                      <dt>Reason</dt>
                      <dd>{record.reason || 'Not available'}</dd>

                      <dt>Control eligible</dt>
                      <dd>{formatBoolean(record.control_eligible)}</dd>

                      <dt>Measured at</dt>
                      <dd>{formatTimestamp(record.measured_at)}</dd>
                    </dl>

                    <details className="live-measurements-details">
                      <summary>Details</summary>
                      <pre>{detailsJson(record.details)}</pre>
                    </details>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p>No measurement records reported yet.</p>
          )}
        </section>
      </details>
    </section>
  )
}

export default LiveMeasurements
