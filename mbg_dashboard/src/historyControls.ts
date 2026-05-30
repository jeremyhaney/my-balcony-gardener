import { DEVICE_REGISTRY, type DeviceKey } from './deviceRegistry'

export type HistoryDeviceKey = DeviceKey
export type HistoryWindowKey = '24h' | '7d' | '1m' | '3m' | '6m' | '1y' | 'all'

export type HistoryDeviceOption = {
  key: HistoryDeviceKey
  label: string
  hostedLabel: string
  deviceId: string
  role: string
  description: string
}

export type HistoryWindowOption = {
  key: HistoryWindowKey
  label: string
  limit: number
  getLowerBoundIso: (now: Date) => string | undefined
}

export const HISTORY_DEVICE_OPTIONS: HistoryDeviceOption[] = DEVICE_REGISTRY.map((device) => ({
  key: device.key,
  label: device.label,
  hostedLabel: device.hostedLabel,
  deviceId: device.deviceId,
  role: device.role,
  description: device.description,
}))

export const HISTORY_WINDOW_OPTIONS: HistoryWindowOption[] = [
  {
    key: '24h',
    label: '24 hours',
    limit: 200,
    getLowerBoundIso: (now) => subtractHours(now, 24).toISOString(),
  },
  {
    key: '7d',
    label: '7 days',
    limit: 800,
    getLowerBoundIso: (now) => subtractDays(now, 7).toISOString(),
  },
  {
    key: '1m',
    label: '1 month',
    limit: 3500,
    getLowerBoundIso: (now) => subtractMonths(now, 1).toISOString(),
  },
  {
    key: '3m',
    label: '3 months',
    limit: 10000,
    getLowerBoundIso: (now) => subtractMonths(now, 3).toISOString(),
  },
  {
    key: '6m',
    label: '6 months',
    limit: 20000,
    getLowerBoundIso: (now) => subtractMonths(now, 6).toISOString(),
  },
  {
    key: '1y',
    label: '1 year',
    limit: 40000,
    getLowerBoundIso: (now) => subtractYears(now, 1).toISOString(),
  },
  {
    key: 'all',
    label: 'all-time',
    limit: 50000,
    getLowerBoundIso: () => undefined,
  },
]

const DEFAULT_DEVICE_KEY: HistoryDeviceKey = 'balcony'
const DEFAULT_WINDOW_KEY: HistoryWindowKey = '24h'

const configuredDeviceId = import.meta.env.VITE_MBG_DEVICE_ID?.trim() ?? ''

export const getConfiguredDeviceId = (): string => configuredDeviceId

export const getHistoryDeviceOption = (key: string | null): HistoryDeviceOption | undefined =>
  HISTORY_DEVICE_OPTIONS.find((option) => option.key === key)

export const getHistoryWindowOption = (key: string | null): HistoryWindowOption | undefined =>
  HISTORY_WINDOW_OPTIONS.find((option) => option.key === key)

export const resolveHistoryDeviceOption = (
  searchParams: URLSearchParams,
): HistoryDeviceOption => {
  const queryDevice = getHistoryDeviceOption(searchParams.get('device'))

  if (queryDevice) {
    return queryDevice
  }

  const configuredDevice = HISTORY_DEVICE_OPTIONS.find(
    (option) => option.deviceId === configuredDeviceId,
  )

  return configuredDevice ?? getHistoryDeviceOption(DEFAULT_DEVICE_KEY)!
}

export const resolveHistoryWindowOption = (
  searchParams: URLSearchParams,
): HistoryWindowOption =>
  getHistoryWindowOption(searchParams.get('window')) ?? getHistoryWindowOption(DEFAULT_WINDOW_KEY)!

export const getHistoryControlStateFromUrl = () => {
  const searchParams = new URLSearchParams(window.location.search)

  return {
    device: resolveHistoryDeviceOption(searchParams),
    window: resolveHistoryWindowOption(searchParams),
  }
}

export const updateHistoryControlUrl = (
  deviceKey: HistoryDeviceKey,
  windowKey: HistoryWindowKey,
) => {
  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set('device', deviceKey)
  nextUrl.searchParams.set('window', windowKey)
  window.history.pushState(null, '', nextUrl)
}

const subtractHours = (date: Date, hours: number): Date => {
  const nextDate = new Date(date)
  nextDate.setHours(nextDate.getHours() - hours)
  return nextDate
}

const subtractDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() - days)
  return nextDate
}

const subtractMonths = (date: Date, months: number): Date => {
  const nextDate = new Date(date)
  nextDate.setMonth(nextDate.getMonth() - months)
  return nextDate
}

const subtractYears = (date: Date, years: number): Date => {
  const nextDate = new Date(date)
  nextDate.setFullYear(nextDate.getFullYear() - years)
  return nextDate
}
