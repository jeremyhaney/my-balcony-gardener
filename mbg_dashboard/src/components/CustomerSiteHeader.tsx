import type { CustomerSite } from '../customerSites'
import type { HistoryDeviceOption } from '../historyControls'
import './CustomerSiteHeader.css'

type CustomerSiteHeaderProps = {
  customerSite: CustomerSite
  assignedDevices: HistoryDeviceOption[]
}

const CustomerSiteHeader = ({
  customerSite,
  assignedDevices,
}: CustomerSiteHeaderProps) => {
  const primaryDevice = assignedDevices.find(
    (device) => device.key === customerSite.primaryDeviceKey,
  )
  const supportDevices = assignedDevices.filter(
    (device) => device.key !== customerSite.primaryDeviceKey,
  )

  return (
    <section className="customer-site-header" aria-label="Customer site context">
      <div className="customer-site-header-main">
        <div>
          <p className="customer-site-header-eyebrow">Customer View</p>
          <h2>{customerSite.siteName}</h2>
          <p className="customer-site-header-copy">
            Read-only pilot site view for {customerSite.customerName} using assigned
            device telemetry from {customerSite.siteLocationLabel}.
          </p>
        </div>
        <span className="customer-site-header-mode">Access simulation</span>
      </div>

      <div className="customer-site-header-grid">
        <div>
          <span className="customer-site-header-label">Primary controller</span>
          <strong>{primaryDevice?.hostedLabel ?? 'Balcony01'}</strong>
          <p>Real installed controller telemetry for this pilot site.</p>
        </div>
        <div>
          <span className="customer-site-header-label">Support evidence</span>
          <strong>{formatSupportDeviceNames(supportDevices)}</strong>
          <p>Telemetry-only site evidence; no hosted watering authority.</p>
        </div>
        <div>
          <span className="customer-site-header-label">Pilot role</span>
          <strong>{customerSite.supportRoleLabel}</strong>
          <p>Demo context only, not login-based access control.</p>
        </div>
      </div>

      <p className="customer-site-header-warning">
        Access simulation only: real customer login, membership checks, and RLS
        isolation are deferred.
      </p>
    </section>
  )
}

const formatSupportDeviceNames = (devices: HistoryDeviceOption[]): string =>
  devices.length > 0
    ? devices.map((device) => device.hostedLabel).join(', ')
    : 'None assigned'

export default CustomerSiteHeader
