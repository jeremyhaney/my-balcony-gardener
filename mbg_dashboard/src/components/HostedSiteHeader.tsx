import type { CustomerSite } from '../customerSites'
import type { HistoryDeviceOption } from '../historyControls'
import './HostedSiteHeader.css'

type HostedSiteHeaderProps = {
  customerSite: CustomerSite
  assignedDevices: HistoryDeviceOption[]
}

const HostedSiteHeader = ({
  customerSite,
  assignedDevices,
}: HostedSiteHeaderProps) => {
  const primaryDevice = assignedDevices.find(
    (device) => device.key === customerSite.primaryDeviceKey,
  )
  const supportDevices = assignedDevices.filter(
    (device) => device.key !== customerSite.primaryDeviceKey,
  )

  return (
    <section className="hosted-site-header" aria-label="Garden site context">
      <div className="hosted-site-header-main">
        <h2>{customerSite.siteName}</h2>
        <p className="hosted-site-header-copy">Read-only online dashboard</p>
      </div>

      <div className="hosted-site-header-devices" aria-label="Assigned devices">
        <h3>Devices</h3>
        <ul>
          <li>
            <strong>{primaryDevice?.hostedLabel ?? 'Balcony01'}</strong>
            <span>Primary controller</span>
          </li>
          {supportDevices.map((device) => (
            <li key={device.key}>
              <strong>{device.hostedLabel}</strong>
              <span>Garden readings support sensor</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hosted-site-header-note">
        <strong>Pilot simulation</strong>
        <span>Static site assignment. Real login and customer isolation are deferred.</span>
      </div>
    </section>
  )
}

export default HostedSiteHeader
