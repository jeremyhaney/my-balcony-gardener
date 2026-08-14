import type { DeviceKey } from './deviceRegistry'

export type CustomerSiteAccessMode = 'pilot-simulation'

export type CustomerSite = {
  customerKey: string
  customerName: string
  siteKey: string
  siteName: string
  siteLocationLabel: string
  accessMode: CustomerSiteAccessMode
  deviceKeys: DeviceKey[]
  primaryDeviceKey: DeviceKey
  supportRoleLabel: string
}

export const PHASE_7L1_PILOT_CUSTOMER_SITE: CustomerSite = {
  customerKey: 'jeremy',
  customerName: 'Jeremy Haney',
  siteKey: 'jeremy-balcony-pilot',
  siteName: 'Jeremy Balcony Pilot',
  siteLocationLabel: "Jeremy's Balcony",
  accessMode: 'pilot-simulation',
  deviceKeys: ['balcony02'],
  primaryDeviceKey: 'balcony02',
  supportRoleLabel: 'site-owner / support-admin simulation',
}
