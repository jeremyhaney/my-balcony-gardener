import type {
  CapabilitiesResponse,
  LocalStatusResponse,
  MeasurementsResponse,
} from './types/liveMeasurements'

const trimTrailingSlash = (baseUrl: string): string => baseUrl.replace(/\/$/, '')

const fetchJson = async <T>(baseUrl: string, path: string): Promise<T> => {
  const response = await fetch(`${trimTrailingSlash(baseUrl)}${path}`)

  if (!response.ok) {
    throw new Error(`${path} returned status ${response.status}`)
  }

  return (await response.json()) as T
}

export const fetchLocalStatus = (baseUrl: string): Promise<LocalStatusResponse> =>
  fetchJson<LocalStatusResponse>(baseUrl, '/status')

export const fetchLocalCapabilities = (baseUrl: string): Promise<CapabilitiesResponse> =>
  fetchJson<CapabilitiesResponse>(baseUrl, '/capabilities')

export const fetchLocalMeasurements = (baseUrl: string): Promise<MeasurementsResponse> =>
  fetchJson<MeasurementsResponse>(baseUrl, '/measurements')

export const postLocalWaterNow = async (baseUrl: string): Promise<void> => {
  const response = await fetch(`${trimTrailingSlash(baseUrl)}/water-now`, {
    method: 'POST',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `/water-now returned status ${response.status}`)
  }
}
