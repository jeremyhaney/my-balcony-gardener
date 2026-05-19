// src/components/LiveStats.tsx
import { type ChangeEvent, useEffect, useState } from 'react'
import {
  DEVICE_REGISTRY,
  getDeviceById,
  type DeviceKey,
  type RegisteredDevice,
} from '../deviceRegistry'
import { LOCAL_CONTROL_TARGETS, type LocalControlTarget } from '../localControlTargets'
import type { SensorData, SensorLogRow } from '../types/sensorLog'

type FallbackSensorLogRow = Omit<SensorLogRow, 'id'>

const DEFAULT_LOCAL_TARGET_KEY: DeviceKey = 'balcony'

const DEFAULT_SENSOR_DATA: SensorData = {
  temperature: 0,
  humidity: 0,
  moisture: 0,
  watering: false,
  lastWateredTime: 'Never',
  lastWateringDuration: 0,
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error'

const finiteNumberOrUndefined = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const formatDisplayDateTime = (value: string): string => {
  if (!value || value.trim() === '' || value === 'Never') {
    return 'Never'
  }

  const parsedValue = new Date(value)

  return Number.isNaN(parsedValue.getTime()) ? value : parsedValue.toLocaleString()
}

const getDeviceForTarget = (target: LocalControlTarget | undefined) =>
  target ? DEVICE_REGISTRY.find((device) => device.key === target.deviceKey) : undefined

const getLocalTargetByKey = (key: string | null) =>
  LOCAL_CONTROL_TARGETS.find((target) => target.deviceKey === key)

const getInitialLocalTargetKey = (): DeviceKey => {
  const queryTarget = getLocalTargetByKey(
    new URLSearchParams(window.location.search).get('localTarget'),
  )

  return queryTarget?.deviceKey ?? DEFAULT_LOCAL_TARGET_KEY
}

const getTargetBaseUrl = (target: LocalControlTarget) => `http://${target.expectedLocalIp}`

const updateLocalTargetUrl = (targetKey: DeviceKey) => {
  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set('localTarget', targetKey)
  window.history.replaceState(null, '', nextUrl)
}

const getLocalTargetSafety = (
  localTarget: LocalControlTarget | undefined,
  expectedDevice: RegisteredDevice | undefined,
  reportedDeviceId: string,
) => {
  if (!localTarget || !expectedDevice) {
    return 'Disabled: selected local target is not registered for manual control.'
  }

  if (!localTarget.manualActionAllowed) {
    return `Disabled: ${localTarget.manualActionSafetyText}`
  }

  if (localTarget.deviceKey === 'balcony' && expectedDevice.role !== 'controller') {
    return `Disabled: ${expectedDevice.label} is a ${expectedDevice.role}, not a controller.`
  }

  if (localTarget.deviceKey === 'bench' && expectedDevice.role !== 'bench') {
    return `Disabled: ${expectedDevice.label} is a ${expectedDevice.role}, not a bench unit.`
  }

  if (!reportedDeviceId) {
    return 'Disabled: /logs did not report a device_id.'
  }

  if (reportedDeviceId !== expectedDevice.deviceId.toLowerCase()) {
    return `Disabled: /logs device_id does not match ${expectedDevice.label}.`
  }

  return `Enabled: ${localTarget.manualActionSafetyText}`
}

const LiveStats = () => {
  const [selectedLocalTargetKey, setSelectedLocalTargetKey] = useState<DeviceKey>(
    getInitialLocalTargetKey,
  )
  const [latest, setLatest] = useState<SensorLogRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedLocalTarget = getLocalTargetByKey(selectedLocalTargetKey)
  const selectedDevice = getDeviceForTarget(selectedLocalTarget)

  useEffect(() => {
    let isMounted = true

    if (!selectedLocalTarget) {
      setLatest(null)
      setError('Selected local control target is not configured.')

      return () => {
        isMounted = false
      }
    }

    const logsEndpoint = `${getTargetBaseUrl(selectedLocalTarget)}/logs`

    setLatest(null)
    setError(null)

    const fetchFromSelectedTarget = async () => {
      try {
        const response = await fetch(logsEndpoint)
        if (!response.ok) throw new Error(`Status ${response.status}`)

        const data = (await response.json()) as Partial<FallbackSensorLogRow>
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
        }

        if (isMounted) {
          setLatest(transformedData)
          setError(null)
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Local target fetch failed:', getErrorMessage(err))
          setLatest(null)
          setError(`${selectedDevice?.label ?? 'Selected local target'} is unreachable.`)
        }
      }
    }

    void fetchFromSelectedTarget()

    const interval = setInterval(() => {
      if (isMounted) {
        void fetchFromSelectedTarget()
      }
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [selectedDevice?.label, selectedLocalTarget])

  const handleLocalTargetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTarget = getLocalTargetByKey(event.target.value)

    if (!nextTarget) {
      return
    }

    setSelectedLocalTargetKey(nextTarget.deviceKey)
    updateLocalTargetUrl(nextTarget.deviceKey)
  }

  const sensorData = latest?.data ?? DEFAULT_SENSOR_DATA
  const reportedDeviceId = latest?.device_id.trim().toLowerCase() ?? ''
  const reportedDevice = reportedDeviceId ? getDeviceById(reportedDeviceId) : undefined
  const waterNowStatus = error
    ? `Disabled: ${error}`
    : getLocalTargetSafety(selectedLocalTarget, selectedDevice, reportedDeviceId)
  const isManualActionSafe =
    !error &&
    Boolean(selectedLocalTarget) &&
    Boolean(selectedDevice) &&
    selectedLocalTarget?.manualActionAllowed === true &&
    (selectedLocalTarget?.deviceKey === 'bench'
      ? selectedDevice?.role === 'bench'
      : selectedDevice?.role === 'controller') &&
    reportedDeviceId !== '' &&
    reportedDeviceId === selectedDevice?.deviceId.toLowerCase()

  const {
    temperature = 0,
    humidity = 0,
    moisture = 0,
    soilRawAdc,
    watering = false,
    lastWateredTime = 'Never',
    lastWateringDuration = 0,
  } = sensorData

  return (
    <>
      <section
        aria-label="Local control target"
        style={{
          margin: '0 0 1.5rem',
          padding: '1rem',
          backgroundColor: isManualActionSafe
            ? 'rgba(22, 101, 52, 0.2)'
            : 'rgba(127, 29, 29, 0.25)',
          border: `1px solid ${
            isManualActionSafe ? 'rgba(22, 101, 52, 0.55)' : 'rgba(127, 29, 29, 0.65)'
          }`,
          borderRadius: '6px',
          color: 'white',
        }}
      >
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Local Control Target</h2>
        <label
          style={{
            display: 'grid',
            gap: '0.25rem',
            maxWidth: '360px',
            marginBottom: '0.75rem',
          }}
        >
          <span>Selected unit</span>
          <select
            value={selectedLocalTargetKey}
            onChange={handleLocalTargetChange}
            style={{ padding: '0.4rem' }}
          >
            {LOCAL_CONTROL_TARGETS.map((target) => {
              const device = getDeviceForTarget(target)

              return (
                <option key={target.deviceKey} value={target.deviceKey}>
                  {device?.label ?? target.deviceKey} ({target.expectedLocalIp})
                </option>
              )
            })}
          </select>
        </label>
        <p style={{ margin: '0.25rem 0' }}>
          <strong>Manual action target:</strong>{' '}
          {selectedDevice && selectedLocalTarget
            ? `${selectedDevice.label} (${selectedLocalTarget.expectedLocalIp})`
            : 'Unknown target'}
        </p>
        <p style={{ margin: '0.25rem 0' }}>
          <strong>Live /logs reports:</strong>{' '}
          {reportedDevice
            ? `${reportedDevice.label} (${reportedDevice.role})`
            : reportedDeviceId
              ? `Unknown device UUID ${latest?.device_id ?? reportedDeviceId}`
              : 'No device_id reported'}
        </p>
        <p style={{ margin: '0.25rem 0' }}>
          <strong>Manual action status:</strong> {waterNowStatus}
        </p>
        {selectedLocalTarget?.warningText ? (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {selectedLocalTarget.warningText}
          </p>
        ) : null}
      </section>

      {error ? (
        <div
          style={{
            color: 'red',
            padding: '1rem',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            margin: '1rem 0',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      ) : !latest ? (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            margin: '1rem 0',
            textAlign: 'center',
          }}
        >
          Loading live stats...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <div>
            <strong>Temp:</strong> {temperature.toFixed(1)} F
          </div>
          <div>
            <strong>Humidity:</strong> {humidity.toFixed(1)} %
          </div>
          <div>
            <strong>Soil Moisture:</strong> {moisture.toFixed(1)}%
          </div>
          {Number.isFinite(soilRawAdc) && (
            <div>
              <strong>Raw Soil ADC:</strong> {soilRawAdc}
            </div>
          )}
          <div>
            <strong>Last Watering Duration:</strong> {lastWateringDuration.toFixed(1)}s
          </div>
          <div>
            <strong>Last Watered:</strong> {formatDisplayDateTime(lastWateredTime)}
          </div>
          <div>
            <strong>Log Time:</strong> {new Date(latest.timestamp).toLocaleString()}
          </div>
          <div>
            <strong>Selected Unit Watering State:</strong> {watering ? 'Yes' : 'No'}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={async () => {
            if (!isManualActionSafe || !selectedDevice || !selectedLocalTarget) {
              return
            }

            try {
              const response = await fetch(`${getTargetBaseUrl(selectedLocalTarget)}/water-now`, {
                method: 'POST',
              })
              if (response.ok) {
                alert(selectedLocalTarget.manualActionSuccessMessage)
              } else {
                alert('Manual action request failed.')
              }
            } catch (err) {
              console.error('Error triggering water:', err)
              alert('Unable to reach ESP32.')
            }
          }}
          disabled={!isManualActionSafe}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          style={{
            cursor: isManualActionSafe ? 'pointer' : 'not-allowed',
            opacity: isManualActionSafe ? 1 : 0.45,
            filter: isManualActionSafe ? 'none' : 'grayscale(1)',
          }}
        >
          {selectedLocalTarget?.manualActionLabel ?? 'Manual Action'}:{' '}
          {selectedDevice?.label ?? 'Unknown Target'}
        </button>
      </div>
    </>
  )
}

export default LiveStats
