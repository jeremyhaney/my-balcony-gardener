import type { HostedWateringCycle } from '../hostedWateringCycles'
import './HostedWateringEvents.css'

type HostedWateringEventsProps = {
  cycles: HostedWateringCycle[]
  isLoading: boolean
  error: string | null
}

const HostedWateringEvents = ({
  cycles,
  isLoading,
  error,
}: HostedWateringEventsProps) => {
  const visibleCycles = cycles.slice(0, 10)
  const olderCycles = cycles.slice(10)
  const hasCycles = cycles.length > 0
  const isBlockingLoad = isLoading && !hasCycles
  const isRefreshing = isLoading && hasCycles

  return (
    <section className="hosted-watering-events" aria-label="Watering History">
      <div className="hosted-watering-events-header">
        <h2>Watering History</h2>
        {isRefreshing ? <span>Refreshing</span> : null}
      </div>

      {error ? <p className="hosted-watering-events-error">{error}</p> : null}

      {isBlockingLoad ? (
        <p className="hosted-watering-events-note">Loading watering history...</p>
      ) : null}

      {!isBlockingLoad && !hasCycles ? (
        <p className="hosted-watering-events-note">
          No completed watering cycles recorded for this device in this window yet.
        </p>
      ) : null}

      {hasCycles ? (
        <>
          <WateringCycleTable cycles={visibleCycles} />

          {olderCycles.length > 0 ? (
            <details className="hosted-watering-events-older">
              <summary>Older watering cycles</summary>
              <WateringCycleTable cycles={olderCycles} />
            </details>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

const WateringCycleTable = ({ cycles }: { cycles: HostedWateringCycle[] }) => (
  <div className="hosted-watering-events-table-wrap">
    <table className="hosted-watering-events-table">
      <thead>
        <tr>
          <th scope="col">Start Time</th>
          <th scope="col">Duration</th>
          <th scope="col">Watering Type</th>
        </tr>
      </thead>
      <tbody>
        {cycles.map((cycle) => (
          <tr key={cycle.id}>
            <td>{formatTimestamp(cycle.startAt)}</td>
            <td>{formatDuration(cycle.durationSeconds)}</td>
            <td>{cycle.displayReason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available'
  }

  const parsedValue = new Date(value)

  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : value
}

const formatDuration = (value: number): string =>
  `${value.toLocaleString()} ${value === 1 ? 'second' : 'seconds'}`

export default HostedWateringEvents
