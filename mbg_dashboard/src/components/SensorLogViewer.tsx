import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchDeviceDiagnostics,
  fetchGardenDevices,
  fetchHistoryLogs,
  fetchHostedGen2Measurements,
  fetchHostedWateringEvents,
  type GardenDevice,
  type HostedDataScope,
  type DeviceDiagnostics,
  type HostedWateringEventRow,
} from '../api'
import { PHASE_7L1_PILOT_CUSTOMER_SITE } from '../customerSites'
import {
  getHistoryControlStateFromUrl,
  getHistoryDeviceOption,
  getHistoryDeviceOptionsForDeviceKeys,
  getHistoryWindowOption,
  HISTORY_DEVICE_OPTIONS,
  HISTORY_WINDOW_OPTIONS,
  type HistoryDeviceOption,
  type HistoryDeviceKey,
  type HistoryWindowOption,
  updateHistoryControlUrl,
} from '../historyControls'
import { calculateHostedGen2Health } from '../hostedGen2Health'
import { getHostedWateringCycles } from '../hostedWateringCycles'
import { calculateTelemetryHealth } from '../telemetryHealth'
import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import type { SensorLogRow } from '../types/sensorLog'
import DeviceDiagnosticsPanel from './DeviceDiagnosticsPanel'
import DualAxisChart from './DualAxisChart'
import HostedGen2Measurements from './HostedGen2Measurements'
import HostedGen2TrendChart from './HostedGen2TrendChart'
import HostedSiteHeader from './HostedSiteHeader'
import HostedWateringEvents from './HostedWateringEvents'
import SensorHealthPanel from './SensorHealthPanel'

const isValidPercent = (value: number): boolean =>
  Number.isFinite(value) && value >= 0 && value <= 100

const sanitizePercent = (value: number): number | null => (isValidPercent(value) ? value : null)

const hasUsableTimestamp = (timestamp: string): boolean =>
  Number.isFinite(new Date(timestamp).getTime())

const HISTORY_REFRESH_INTERVAL_MS = 10000
const HOSTED_GEN2_ROWS_PER_HISTORY_ROW_ESTIMATE = 8

type SensorLogViewerProps = {
  isHostedReadonly?: boolean
  hostedReadonlyScope?: 'demo' | 'pilot' | 'customer' | 'support'
  showHostedSiteHeader?: boolean
  demoGuideTarget?: DemoGuideTarget
  emptyStateMessage?: string
}

type DeviceStatusPanelKey = 'status' | 'diagnostics'
export type DemoGuideTarget = 'readings' | 'status' | 'device' | 'window' | 'chart'

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error'

const SensorLogViewer = ({
  isHostedReadonly = false,
  hostedReadonlyScope = 'demo',
  showHostedSiteHeader = true,
  demoGuideTarget,
  emptyStateMessage,
}: SensorLogViewerProps) => {
  const hostedDataScope = getHostedDataScope(hostedReadonlyScope)
  const isProtectedHostedScope = isHostedReadonly && hostedDataScope !== 'demo'
  const pilotCustomerSite =
    isHostedReadonly && hostedDataScope === 'demo' ? PHASE_7L1_PILOT_CUSTOMER_SITE : null
  const demoDeviceOptions = useMemo(
    () =>
      pilotCustomerSite
        ? getHistoryDeviceOptionsForDeviceKeys(pilotCustomerSite.deviceKeys)
        : HISTORY_DEVICE_OPTIONS,
    [pilotCustomerSite],
  )
  const deviceStatusPanelsRef = useRef<HTMLDivElement>(null)
  const [authorizedDeviceOptions, setAuthorizedDeviceOptions] = useState<HistoryDeviceOption[]>([])
  const [authorizedDevicesError, setAuthorizedDevicesError] = useState<string | null>(null)
  const [isAuthorizedDevicesLoading, setIsAuthorizedDevicesLoading] = useState(
    isProtectedHostedScope,
  )
  const [logs, setLogs] = useState<SensorLogRow[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<DeviceDiagnostics | null>(null)
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null)
  const [hostedGen2Rows, setHostedGen2Rows] = useState<HostedGen2MeasurementRow[]>([])
  const [hostedGen2Error, setHostedGen2Error] = useState<string | null>(null)
  const [isHostedGen2Loading, setIsHostedGen2Loading] = useState(false)
  const [wateringEventRows, setWateringEventRows] = useState<HostedWateringEventRow[]>([])
  const [wateringEventsError, setWateringEventsError] = useState<string | null>(null)
  const [isWateringEventsLoading, setIsWateringEventsLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [openDeviceStatusPanel, setOpenDeviceStatusPanel] =
    useState<DeviceStatusPanelKey | null>(null)
  const deviceOptions = isProtectedHostedScope ? authorizedDeviceOptions : demoDeviceOptions
  const [selectedDevice, setSelectedDevice] = useState<HistoryDeviceOption>(
    () => getHistoryControlStateFromUrl(demoDeviceOptions).device,
  )
  const [selectedWindow, setSelectedWindow] = useState<HistoryWindowOption>(
    () => getHistoryControlStateFromUrl().window,
  )

  useEffect(() => {
    if (!isProtectedHostedScope) {
      setAuthorizedDeviceOptions([])
      setAuthorizedDevicesError(null)
      setIsAuthorizedDevicesLoading(false)
      return
    }

    let isMounted = true
    setIsAuthorizedDevicesLoading(true)

    const loadAuthorizedDevices = async () => {
      const result = await fetchGardenDevices(
        hostedDataScope === 'support' ? 'support' : 'customer',
      )

      if (!isMounted) {
        return
      }

      setAuthorizedDeviceOptions(result.devices.map(mapGardenDeviceToHistoryOption))
      setAuthorizedDevicesError(result.error)
      setIsAuthorizedDevicesLoading(false)
    }

    void loadAuthorizedDevices()

    return () => {
      isMounted = false
    }
  }, [hostedDataScope, isProtectedHostedScope])

  useEffect(() => {
    if (deviceOptions.length === 0) {
      return
    }

    const nextControlState = getHistoryControlStateFromUrl(deviceOptions)
    const selectedDeviceIsAllowed = deviceOptions.some(
      (device) => device.key === selectedDevice.key,
    )

    if (!selectedDeviceIsAllowed) {
      setSelectedDevice(nextControlState.device)
    }
  }, [deviceOptions, selectedDevice.key])

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      if (isProtectedHostedScope && isAuthorizedDevicesLoading) {
        return
      }

      if (isProtectedHostedScope && deviceOptions.length === 0) {
        setLogs([])
        setHistoryError(null)
        setDiagnostics(null)
        setDiagnosticsError(null)
        setHostedGen2Rows([])
        setHostedGen2Error(null)
        setIsHostedGen2Loading(false)
        setWateringEventRows([])
        setWateringEventsError(null)
        setIsWateringEventsLoading(false)
        setIsLoading(false)
        return
      }

      const lowerBoundIso = selectedWindow.getLowerBoundIso(new Date())
      const hostedGen2Request = isHostedReadonly
        ? fetchHostedGen2Measurements(selectedDevice.deviceId, {
            startTime: lowerBoundIso,
            limit: Math.max(1000, selectedWindow.limit * HOSTED_GEN2_ROWS_PER_HISTORY_ROW_ESTIMATE),
            scope: hostedDataScope,
          })
            .then((rows) => ({ rows, error: null }))
            .catch((error: unknown) => ({
              rows: [] as HostedGen2MeasurementRow[],
              error: `Supabase Gen2 measurements are currently unavailable: ${getErrorMessage(error)}`,
            }))
        : Promise.resolve({ rows: [] as HostedGen2MeasurementRow[], error: null })
      const wateringEventsRequest = isProtectedHostedScope
        ? fetchHostedWateringEvents(selectedDevice.deviceId, {
            startTime: lowerBoundIso,
            limit: 50,
            scope: hostedDataScope === 'support' ? 'support' : 'customer',
          })
        : Promise.resolve({ rows: [] as HostedWateringEventRow[], error: null })

      if (isHostedReadonly) {
        setIsHostedGen2Loading(true)
      }

      if (isProtectedHostedScope) {
        setIsWateringEventsLoading(true)
      }

      const [historyResult, diagnosticsResult, hostedGen2Result, wateringEventsResult] =
        await Promise.all([
          hostedDataScope === 'demo'
            ? fetchHistoryLogs(
                selectedWindow.limit,
                selectedDevice.deviceId,
                lowerBoundIso,
              )
            : Promise.resolve({ rows: [] as SensorLogRow[], error: null }),
          fetchDeviceDiagnostics(selectedDevice.deviceId, hostedDataScope),
          hostedGen2Request,
          wateringEventsRequest,
        ])

      if (!isMounted) {
        return
      }

      setLogs(historyResult.rows)
      setHistoryError(historyResult.error)
      setDiagnostics(diagnosticsResult.diagnostics)
      setDiagnosticsError(diagnosticsResult.error)
      setHostedGen2Rows(hostedGen2Result.rows)
      setHostedGen2Error(hostedGen2Result.error)
      setIsHostedGen2Loading(false)
      setWateringEventRows(wateringEventsResult.rows)
      setWateringEventsError(wateringEventsResult.error)
      setIsWateringEventsLoading(false)
      setIsLoading(false)
    }

    void loadHistory()

    const refreshTimer = window.setInterval(() => {
      void loadHistory()
    }, HISTORY_REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
    }
  }, [
    deviceOptions.length,
    hostedDataScope,
    isAuthorizedDevicesLoading,
    isHostedReadonly,
    isProtectedHostedScope,
    selectedDevice,
    selectedWindow,
  ])

  useEffect(() => {
    const handlePopState = () => {
      if (deviceOptions.length === 0) {
        return
      }

      const nextControlState = getHistoryControlStateFromUrl(deviceOptions)
      setSelectedDevice(nextControlState.device)
      setSelectedWindow(nextControlState.window)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [deviceOptions])

  useEffect(() => {
    if (!openDeviceStatusPanel) {
      return
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target

      if (
        target instanceof Node &&
        deviceStatusPanelsRef.current?.contains(target)
      ) {
        return
      }

      setOpenDeviceStatusPanel(null)
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown)

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
    }
  }, [openDeviceStatusPanel])

  const handleDeviceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDevice = getHistoryDeviceOption(event.target.value, deviceOptions)

    if (!nextDevice) {
      return
    }

    setSelectedDevice(nextDevice)
    updateHistoryControlUrl(nextDevice.key, selectedWindow.key)
  }

  const handleWindowChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextWindow = getHistoryWindowOption(event.target.value)

    if (!nextWindow) {
      return
    }

    setSelectedWindow(nextWindow)
    updateHistoryControlUrl(selectedDevice.key, nextWindow.key)
  }

  const chartLogs = [...logs]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((log) => {
      const temperature = Number.isFinite(log.data.temperature) ? log.data.temperature : null
      const humidity = sanitizePercent(log.data.humidity)
      const moisture = sanitizePercent(log.data.moisture)

      return {
        timestamp: log.timestamp,
        temperature,
        humidity,
        moisture,
        watering: log.data.watering,
      }
    })
    .filter(
      (log) =>
        hasUsableTimestamp(log.timestamp) &&
        (log.temperature !== null || log.humidity !== null || log.moisture !== null)
    )

  const telemetryHealth = isLoading
    ? null
    : isHostedReadonly
      ? calculateHostedGen2Health(hostedGen2Rows, selectedWindow.key)
      : calculateTelemetryHealth(logs, selectedWindow.key)
  const selectedDeviceLabel = isHostedReadonly ? selectedDevice.hostedLabel : selectedDevice.label
  const wateringCycles = useMemo(
    () => getHostedWateringCycles(wateringEventRows),
    [wateringEventRows],
  )
  const getDemoGuideTargetClass = (target: DemoGuideTarget): string =>
    [
      'demo-guide-target',
      demoGuideTarget === target ? 'is-demo-guide-highlighted' : '',
    ]
      .filter(Boolean)
      .join(' ')

  // Reusable selector markup shared by hosted and legacy control placement.
  const deviceControl = (
    <label
      className={getDemoGuideTargetClass('device')}
      data-guide-target="device"
      style={{ display: 'grid', gap: '0.25rem', fontSize: isHostedReadonly ? '0.82rem' : '0.9rem' }}
    >
      <span>{isHostedReadonly ? 'Device' : 'Device History'}</span>
      <select
        value={selectedDevice.key}
        onChange={handleDeviceChange}
        style={{
          minWidth: isHostedReadonly ? '180px' : '220px',
          padding: isHostedReadonly ? '0.3rem 0.45rem' : '0.4rem',
        }}
      >
        {deviceOptions.map((option) => (
          <option key={option.key} value={option.key}>
            {isHostedReadonly ? option.hostedLabel : option.label}
          </option>
        ))}
      </select>
    </label>
  )

  const windowControl = (
    <label
      className={getDemoGuideTargetClass('window')}
      data-guide-target="window"
      style={{ display: 'grid', gap: '0.25rem', fontSize: isHostedReadonly ? '0.82rem' : '0.9rem' }}
    >
      <span>Window</span>
      <select
        value={selectedWindow.key}
        onChange={handleWindowChange}
        style={{
          minWidth: isHostedReadonly ? '140px' : '160px',
          padding: isHostedReadonly ? '0.3rem 0.45rem' : '0.4rem',
        }}
      >
        {HISTORY_WINDOW_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )

  // Legacy history keeps the existing combined Device History and Window controls.
  const historyControls = (
    <div
      aria-label="Sensor history controls"
      className="sensor-history-controls"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isHostedReadonly ? '0.6rem' : '0.75rem',
        alignItems: 'flex-end',
        marginBottom: isHostedReadonly ? 0 : '1rem',
      }}
    >
      {deviceControl}
      {windowControl}
    </div>
  )

  // Hosted layout separates device context from the chart-associated Window control.
  const hostedDeviceControl = (
    <div
      aria-label="Device selection"
      className="sensor-history-controls hosted-device-control"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        alignItems: 'flex-end',
        marginBottom: 0,
      }}
    >
      {deviceControl}
    </div>
  )

  const hostedWindowControl = (
    <div
      aria-label="History window control"
      className="sensor-history-controls"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        alignItems: 'flex-end',
        marginBottom: 0,
      }}
    >
      {windowControl}
    </div>
  )

  if (isProtectedHostedScope && isAuthorizedDevicesLoading) {
    return (
      <div className="p-4">
        <p className="text-sm">Loading assigned garden devices...</p>
      </div>
    )
  }

  if (isProtectedHostedScope && deviceOptions.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm">
          {authorizedDevicesError ?? emptyStateMessage ?? 'No assigned garden devices found.'}
        </p>
      </div>
    )
  }

  const historyErrorMessage = historyError ? (
    <p className="mb-3 text-sm" style={{ color: '#7f1d1d' }}>
      {historyError}
    </p>
  ) : null

  const deviceStatusPanels = (
    <div
      className={[
        'device-status-panels',
        getDemoGuideTargetClass('status'),
      ].join(' ')}
      data-guide-target="status"
      ref={deviceStatusPanelsRef}
    >
      {telemetryHealth ? (
        <SensorHealthPanel
          health={telemetryHealth}
          isOpen={openDeviceStatusPanel === 'status'}
          onOpenChange={(isOpen) =>
            setOpenDeviceStatusPanel(isOpen ? 'status' : null)
          }
        />
      ) : null}

      <DeviceDiagnosticsPanel
        diagnostics={diagnostics}
        error={diagnosticsError}
        fallbackDeviceLabel={selectedDeviceLabel}
        isOpen={openDeviceStatusPanel === 'diagnostics'}
        onOpenChange={(isOpen) =>
          setOpenDeviceStatusPanel(isOpen ? 'diagnostics' : null)
        }
      />
    </div>
  )

  const sensorHistoryHeader = (
    <>
      <h2 className="text-xl font-bold mb-2">Sensor History</h2>
      {historyControls}
      {historyErrorMessage}
    </>
  )

  const sensorHistoryChart = (
    <>
      {isLoading ? (
        <p className="text-sm">Loading history...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm">No Sensor History rows in this window.</p>
      ) : chartLogs.length === 0 ? (
        <p className="text-sm">History rows were found, but no valid readings are available to chart yet.</p>
      ) : (
        <DualAxisChart sensorLogs={chartLogs} historyWindowKey={selectedWindow.key} />
      )}
    </>
  )

  return (
    <div className="p-4">
      {isHostedReadonly ? (
        <>
          {pilotCustomerSite && showHostedSiteHeader ? (
            <HostedSiteHeader
              customerSite={pilotCustomerSite}
              assignedDevices={deviceOptions}
            />
          ) : null}
          {hostedDeviceControl}
          {deviceStatusPanels}
          <HostedGen2Measurements
            rows={hostedGen2Rows}
            isLoading={isHostedGen2Loading}
            error={hostedGen2Error}
            fallbackDeviceLabel={selectedDeviceLabel}
            className={getDemoGuideTargetClass('readings')}
          />
          <HostedGen2TrendChart
            rows={hostedGen2Rows}
            isLoading={isHostedGen2Loading}
            error={hostedGen2Error}
            controls={hostedWindowControl}
            className={getDemoGuideTargetClass('chart')}
            wateringCycles={isProtectedHostedScope ? wateringCycles : []}
          />
          {isProtectedHostedScope ? (
            <HostedWateringEvents
              cycles={wateringCycles}
              isLoading={isWateringEventsLoading}
              error={wateringEventsError}
            />
          ) : null}
        </>
      ) : (
        <>
          {sensorHistoryHeader}
          {deviceStatusPanels}
          {sensorHistoryChart}
        </>
      )}
    </div>
  )
}

const getHostedDataScope = (
  hostedReadonlyScope: SensorLogViewerProps['hostedReadonlyScope'],
): HostedDataScope => {
  if (hostedReadonlyScope === 'customer') {
    return 'customer'
  }

  if (hostedReadonlyScope === 'support') {
    return 'support'
  }

  return 'demo'
}

const mapGardenDeviceToHistoryOption = (device: GardenDevice): HistoryDeviceOption => ({
  key: device.device_key as HistoryDeviceKey,
  label: device.display_name,
  hostedLabel: device.display_name,
  deviceId: device.device_id,
  role: device.device_role,
  description: formatGardenDeviceDescription(device),
})

const formatGardenDeviceDescription = (device: GardenDevice): string => {
  if (device.garden_device_role === 'support_bench') {
    return 'Support-only bench validation unit.'
  }

  if (device.garden_device_role === 'telemetry_readings_sensor') {
    return 'Telemetry-only garden readings sensor.'
  }

  return 'Primary garden controller.'
}

export default SensorLogViewer
