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
import { COMMISSIONED_FRESHNESS_LIMIT_MS } from '../commissionedEvidencePolicy'
import {
  getCapabilityCardDescriptors,
  getCapabilityChartSeriesDescriptors,
} from '../capabilityPresentation'
import { fetchSupportDeviceCapabilities } from '../supportDeviceCapabilities'
import { getCapabilityConfigurationState } from '../deviceCapabilities'
import { getHostedWateringCycles } from '../hostedWateringCycles'
import { calculateTelemetryHealth } from '../telemetryHealth'
import type { HostedGen2MeasurementRow } from '../types/hostedGen2Measurements'
import type { CommissionedDeviceCapability } from '../types/deviceCapabilities'
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

const HISTORY_REFRESH_INTERVAL_MS = 5 * 60 * 1000
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
  const [capabilities, setCapabilities] = useState<CommissionedDeviceCapability[]>([])
  const [capabilityError, setCapabilityError] = useState<string | null>(null)
  const [isCapabilityLoading, setIsCapabilityLoading] = useState(false)
  const [wateringEventRows, setWateringEventRows] = useState<HostedWateringEventRow[]>([])
  const [wateringEventsError, setWateringEventsError] = useState<string | null>(null)
  const [isWateringEventsLoading, setIsWateringEventsLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const manualRefreshRef = useRef<(() => Promise<void>) | null>(null)
  const refreshGenerationRef = useRef(0)
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
    if (hostedDataScope !== 'support' || isAuthorizedDevicesLoading ||
      !deviceOptions.some((device) => device.key === selectedDevice.key)) {
      setCapabilities([])
      setCapabilityError(null)
      setIsCapabilityLoading(false)
      return
    }

    let isMounted = true
    setCapabilities([])
    setCapabilityError(null)
    setIsCapabilityLoading(true)

    void fetchSupportDeviceCapabilities(selectedDevice.deviceId)
      .then((nextCapabilities) => {
        if (!isMounted) return
        setCapabilities(nextCapabilities)
        setIsCapabilityLoading(false)
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        console.warn('Protected Support capability fetch failed:', error)
        setCapabilities([])
        setCapabilityError(getErrorMessage(error))
        setIsCapabilityLoading(false)
      })

    return () => { isMounted = false }
  }, [deviceOptions, hostedDataScope, isAuthorizedDevicesLoading, selectedDevice])

  useEffect(() => {
    let isMounted = true
    let refreshTimer: number | null = null
    let isRefreshRunning = false
    const refreshGeneration = ++refreshGenerationRef.current

    const loadHistory = async () => {
      if (isRefreshRunning) {
        return
      }

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
        setLastRefreshedAt(new Date())
        return
      }

      if (
        isProtectedHostedScope &&
        !deviceOptions.some((device) => device.key === selectedDevice.key)
      ) {
        return
      }

      isRefreshRunning = true
      setIsRefreshing(true)

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

      try {
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

        if (!isMounted || refreshGeneration !== refreshGenerationRef.current) {
          return
        }

        setLogs(historyResult.rows)
        setHistoryError(historyResult.error)
        setDiagnostics(diagnosticsResult.diagnostics)
        setDiagnosticsError(diagnosticsResult.error)
        setHostedGen2Rows(hostedGen2Result.rows)
        setHostedGen2Error(hostedGen2Result.error)
        setWateringEventRows(wateringEventsResult.rows)
        setWateringEventsError(wateringEventsResult.error)
      } finally {
        isRefreshRunning = false

        if (isMounted && refreshGeneration === refreshGenerationRef.current) {
          setIsHostedGen2Loading(false)
          setIsWateringEventsLoading(false)
          setIsLoading(false)
          setIsRefreshing(false)
          setLastRefreshedAt(new Date())
        }
      }
    }

    const clearRefreshTimer = () => {
      if (refreshTimer !== null) {
        window.clearInterval(refreshTimer)
        refreshTimer = null
      }
    }

    const startRefreshTimer = () => {
      clearRefreshTimer()

      if (document.hidden) {
        return
      }

      refreshTimer = window.setInterval(() => {
        if (!document.hidden) {
          void loadHistory()
        }
      }, HISTORY_REFRESH_INTERVAL_MS)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearRefreshTimer()
        return
      }

      void loadHistory()
      startRefreshTimer()
    }

    manualRefreshRef.current = loadHistory
    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (!document.hidden) {
      void loadHistory()
      startRefreshTimer()
    }

    return () => {
      isMounted = false
      clearRefreshTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (manualRefreshRef.current === loadHistory) {
        manualRefreshRef.current = null
      }
    }
  }, [
    deviceOptions,
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

  const handleManualRefresh = () => {
    void manualRefreshRef.current?.()
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

  const capabilityCardDescriptors = useMemo(
    () => getCapabilityCardDescriptors(capabilities),
    [capabilities],
  )
  const capabilityChartSeriesDescriptors = useMemo(
    () => getCapabilityChartSeriesDescriptors(capabilityCardDescriptors),
    [capabilityCardDescriptors],
  )
  const telemetryHealth = isLoading ||
    (hostedDataScope === 'support' && (isCapabilityLoading || capabilityError !== null))
    ? null
    : isHostedReadonly
      ? calculateHostedGen2Health(
          hostedGen2Rows,
          selectedWindow.key,
          new Date(),
          hostedDataScope === 'support' ? capabilityCardDescriptors : undefined,
        )
      : calculateTelemetryHealth(logs, selectedWindow.key)
  const selectedDeviceLabel = isHostedReadonly ? selectedDevice.hostedLabel : selectedDevice.label
  const wateringCycles = useMemo(
    () => getHostedWateringCycles(wateringEventRows),
    [wateringEventRows],
  )
  const newestHostedMeasuredAtMs = hostedGen2Rows.reduce((newest, row) => {
    const timestamp = new Date(row.measured_at).getTime()
    return Number.isFinite(timestamp) ? Math.max(newest, timestamp) : newest
  }, Number.NEGATIVE_INFINITY)
  const deviceReportingActive =
    (Number.isFinite(newestHostedMeasuredAtMs) && Date.now() >= newestHostedMeasuredAtMs &&
      Date.now() - newestHostedMeasuredAtMs <= COMMISSIONED_FRESHNESS_LIMIT_MS) ||
    (typeof diagnostics?.heartbeat_age_seconds === 'number' &&
      diagnostics.heartbeat_age_seconds >= 0 &&
      diagnostics.heartbeat_age_seconds * 1000 <= COMMISSIONED_FRESHNESS_LIMIT_MS)
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

  const refreshControl = (
    <div className="history-refresh-control">
      <button type="button" disabled={isRefreshing} onClick={handleManualRefresh}>
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>
      <p aria-live="polite" className="history-last-refreshed">
        {lastRefreshedAt ? (
          <>
            Last refreshed:{' '}
            <time dateTime={lastRefreshedAt.toISOString()}>
              {lastRefreshedAt.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </time>
          </>
        ) : (
          'Not refreshed yet'
        )}
      </p>
    </div>
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
      {refreshControl}
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
      {refreshControl}
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

  const capabilityConfigurationState = getCapabilityConfigurationState(
    isCapabilityLoading,
    capabilityError,
    capabilities.length,
  )
  const supportCapabilityState = hostedDataScope === 'support'
    ? capabilityConfigurationState.kind === 'ready'
      ? null
      : capabilityConfigurationState.kind === 'failure'
        ? (
            <div>
              <p className="text-sm">{capabilityConfigurationState.message}</p>
              <details><summary>Technical detail</summary><p>{capabilityError}</p></details>
            </div>
          )
        : <p className="text-sm">{capabilityConfigurationState.message}</p>
    : null

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
          {supportCapabilityState ?? (
            <>
              <HostedGen2Measurements
                rows={hostedGen2Rows}
                cardDescriptors={hostedDataScope === 'support' ? capabilityCardDescriptors : undefined}
                isLoading={isHostedGen2Loading}
                error={hostedGen2Error}
                fallbackDeviceLabel={selectedDeviceLabel}
                className={getDemoGuideTargetClass('readings')}
                supportEvidencePolicy={hostedDataScope === 'support'}
                deviceReportingActive={deviceReportingActive}
                showSupportEngineering={hostedDataScope !== 'customer'}
              />
              <HostedGen2TrendChart
                rows={hostedGen2Rows}
                seriesDescriptors={hostedDataScope === 'support' ? capabilityChartSeriesDescriptors : undefined}
                historyWindowKey={selectedWindow.key}
                isLoading={isHostedGen2Loading}
                error={hostedGen2Error}
                controls={hostedWindowControl}
                className={getDemoGuideTargetClass('chart')}
                wateringCycles={isProtectedHostedScope ? wateringCycles : []}
              />
            </>
          )}
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
