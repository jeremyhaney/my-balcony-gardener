import { DEVICE_REGISTRY, type DeviceKey } from './deviceRegistry'

export type HistoryDeviceKey = DeviceKey
export type HistoryWindowKey =
  '3h' | '6h' | '12h' | '24h' | '7d' | '1m' | '3m' | '6m' | '1y' | 'all'

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

export const HISTORY_WINDOW_OPTIONS: HistoryWindowOption[] = [
  {
    key: '3h',
    label: '3 hours',
    limit: 25,
    getLowerBoundIso: (now) => subtractHours(now, 3).toISOString(),
  },
  {
    key: '6h',
    label: '6 hours',
    limit: 50,
    getLowerBoundIso: (now) => subtractHours(now, 6).toISOString(),
  },
  {
    key: '12h',
    label: '12 hours',
    limit: 100,
    getLowerBoundIso: (now) => subtractHours(now, 12).toISOString(),
  },
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

const DEFAULT_WINDOW_KEY: HistoryWindowKey = '24h'

const configuredDeviceId = import.meta.env.VITE_MBG_DEVICE_ID?.trim() ?? ''

export const getConfiguredDeviceId = (): string => configuredDeviceId

export const getHistoryDeviceOption = (
  key: string | null,
  deviceOptions: HistoryDeviceOption[],
): HistoryDeviceOption | undefined =>
  deviceOptions.find((option) => option.key === key)

export const getHistoryDeviceOptionsForDeviceKeys = (
  deviceKeys: readonly HistoryDeviceKey[],
): HistoryDeviceOption[] =>
  deviceKeys
    .map((deviceKey) => DEVICE_REGISTRY.find((device) => device.key === deviceKey))
    .filter((device): device is (typeof DEVICE_REGISTRY)[number] => Boolean(device))
    .map(mapRegisteredDeviceToHistoryOption)
    .filter((option): option is HistoryDeviceOption => Boolean(option))

export const getHistoryWindowOption = (key: string | null): HistoryWindowOption | undefined =>
  HISTORY_WINDOW_OPTIONS.find((option) => option.key === key)

export const resolveHistoryDeviceOption = (
  searchParams: URLSearchParams,
  deviceOptions: HistoryDeviceOption[],
): HistoryDeviceOption => {
  const queryDevice = getHistoryDeviceOption(searchParams.get('device'), deviceOptions)

  if (queryDevice) {
    return queryDevice
  }

  const configuredDevice = deviceOptions.find(
    (option) => option.deviceId === configuredDeviceId,
  )

  return configuredDevice ?? deviceOptions[0]
}

export const resolveHistoryWindowOption = (
  searchParams: URLSearchParams,
): HistoryWindowOption =>
  getHistoryWindowOption(searchParams.get('window')) ?? getHistoryWindowOption(DEFAULT_WINDOW_KEY)!

export const getHistoryControlStateFromUrl = (
  deviceOptions: HistoryDeviceOption[],
) => {
  const searchParams = new URLSearchParams(window.location.search)

  return {
    device: resolveHistoryDeviceOption(searchParams, deviceOptions),
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

function mapRegisteredDeviceToHistoryOption(
  device: (typeof DEVICE_REGISTRY)[number],
): HistoryDeviceOption {
  return {
    key: device.key,
    label: device.label,
    hostedLabel: device.hostedLabel,
    deviceId: device.deviceId,
    role: device.role,
    description: device.description,
  }
}
