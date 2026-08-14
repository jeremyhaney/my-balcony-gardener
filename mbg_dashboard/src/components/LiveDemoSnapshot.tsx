import { useEffect, useMemo, useState } from "react";
import {
  fetchDeviceDiagnostics,
  fetchHostedGen2Measurements,
  type DeviceDiagnostics,
} from "../api";
import { PHASE_7L1_PILOT_CUSTOMER_SITE } from "../customerSites";
import { DEVICE_REGISTRY } from "../deviceRegistry";
import { formatHostedGen2MeasurementLabel } from "../hostedGen2Display";
import { calculateGardenerMoistureIndex } from "../hostedGen2Presentation";
import {
  getHostedGen2MeasurementDisplayModels,
  isDisplayableHostedGen2Row,
  type HostedGen2MeasurementDisplayModel,
} from "../hostedGen2RecentValue";
import type { HostedGen2MeasurementRow } from "../types/hostedGen2Measurements";
import "./LiveDemoSnapshot.css";

type SnapshotState = {
  rows: HostedGen2MeasurementRow[];
  diagnostics: DeviceDiagnostics | null;
  error: string | null;
  isLoading: boolean;
};

const DEMO_DEVICE_KEY = PHASE_7L1_PILOT_CUSTOMER_SITE.primaryDeviceKey;
const SNAPSHOT_WINDOW_HOURS = 24;
const SNAPSHOT_LIMIT = 1000;
const SYSTEM_REPORTING_FRESH_SECONDS = 35 * 60;
const SNAPSHOT_MOISTURE_SENSOR_KEY = "sen0308_m02";
const SNAPSHOT_MEASUREMENTS = [
  "moisture_index",
  "air_temperature",
  "relative_humidity",
  "soil temp",
];

const demoDevice = DEVICE_REGISTRY.find((device) => device.key === DEMO_DEVICE_KEY);

const LiveDemoSnapshot = () => {
  const [snapshot, setSnapshot] = useState<SnapshotState>({
    rows: [],
    diagnostics: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const loadSnapshot = async () => {
      if (!demoDevice) {
        setSnapshot({
          rows: [],
          diagnostics: null,
          error: "Demo device is not configured.",
          isLoading: false,
        });
        return;
      }

      const startTime = getSnapshotLowerBoundIso();

      try {
        const [rows, diagnosticsResult] = await Promise.all([
          fetchHostedGen2Measurements(demoDevice.deviceId, {
            startTime,
            limit: SNAPSHOT_LIMIT,
          }),
          fetchDeviceDiagnostics(demoDevice.deviceId),
        ]);

        if (!isMounted) {
          return;
        }

        setSnapshot({
          rows,
          diagnostics: diagnosticsResult.diagnostics,
          error: diagnosticsResult.error,
          isLoading: false,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSnapshot({
          rows: [],
          diagnostics: null,
          error: getErrorMessage(error),
          isLoading: false,
        });
      }
    };

    void loadSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayModels = useMemo(
    () => getHostedGen2MeasurementDisplayModels(snapshot.rows),
    [snapshot.rows],
  );
  const latestMeasuredAt = useMemo(
    () => getLatestMeasuredAt(snapshot.rows),
    [snapshot.rows],
  );

  return (
    <section className="live-demo-snapshot" aria-label="Live demo snapshot">
      <div className="live-demo-snapshot-header">
        <p>Live from Jeremy's Balcony</p>
        <span>{snapshot.isLoading ? "Loading" : "Real garden data"}</span>
      </div>

      <div className="live-demo-snapshot-grid">
        {SNAPSHOT_MEASUREMENTS.map((measurementName) => (
          <SnapshotMeasurement
            key={measurementName}
            measurementName={measurementName}
            model={getDisplayModel(measurementName, displayModels)}
            isLoading={snapshot.isLoading}
          />
        ))}

        <SnapshotTile
          label="Last Reading"
          value={snapshot.isLoading ? "Loading" : formatTimestamp(latestMeasuredAt)}
        />
        <SnapshotTile
          label="System Reporting"
          value={snapshot.isLoading ? "Loading" : getSystemReportingLabel(snapshot.diagnostics)}
        />
      </div>

      {snapshot.error ? (
        <p className="live-demo-snapshot-error">{snapshot.error}</p>
      ) : null}

      <a className="live-demo-snapshot-link" href="/demo">
        View detailed demo
      </a>
    </section>
  );
};

type SnapshotMeasurementProps = {
  measurementName: string;
  model: HostedGen2MeasurementDisplayModel | null;
  isLoading: boolean;
};

const SnapshotMeasurement = ({
  measurementName,
  model,
  isLoading,
}: SnapshotMeasurementProps) => (
  <SnapshotTile
    label={formatHostedGen2MeasurementLabel(measurementName)}
    value={isLoading ? "Loading" : formatMeasurementValue(measurementName, model?.displayRow)}
  />
);

type SnapshotTileProps = {
  label: string;
  value: string;
};

const SnapshotTile = ({ label, value }: SnapshotTileProps) => (
  <article className="live-demo-snapshot-tile">
    <h2>{label}</h2>
    <p>{value}</p>
  </article>
);

const getDisplayModel = (
  measurementName: string,
  models: HostedGen2MeasurementDisplayModel[],
): HostedGen2MeasurementDisplayModel | null => {
  if (normalizeText(measurementName) === "moisture_index") {
    // M02 is the intentionally selected temporary representative channel for the public
    // landing snapshot; broader presentation belongs in the capability-driven frontend redesign.
    const model = models.find(
      (candidate) => normalizeText(candidate.latestRow.sensor_key) === SNAPSHOT_MOISTURE_SENSOR_KEY,
    );

    if (!model) {
      return null;
    }

    return {
      ...model,
      displayRow: isDisplayableHostedGen2Row(model.displayRow)
        ? {
            ...model.displayRow,
            measurement_name: "moisture_index",
            measurement_unit: "index",
            measurement_value: calculateGardenerMoistureIndex(model.displayRow.measurement_value),
          }
        : null,
    };
  }

  return models.find((model) =>
    isCompatibleSnapshotMeasurement(measurementName, model.latestRow),
  ) ?? null;
};

const isCompatibleSnapshotMeasurement = (
  requestedMeasurementName: string,
  row: HostedGen2MeasurementRow,
): boolean => {
  const requestedName = normalizeText(requestedMeasurementName);
  const actualName = normalizeText(row.measurement_name);
  const sensorType = normalizeText(row.sensor_type);
  const sensorKey = normalizeText(row.sensor_key);

  if (requestedName === "soil temp") {
    return (
      actualName === "soil temp" ||
      (actualName === "temperature" &&
        (sensorType.includes("ds18b20") || sensorKey === "ds18b20_temperature"))
    );
  }

  return actualName === requestedName;
};

const getLatestMeasuredAt = (rows: HostedGen2MeasurementRow[]): string | null => {
  const latestRow = [...rows].sort(
    (left, right) =>
      new Date(right.measured_at).getTime() - new Date(left.measured_at).getTime(),
  )[0];

  return latestRow?.measured_at ?? null;
};

const getSnapshotLowerBoundIso = (): string => {
  const lowerBound = new Date();
  lowerBound.setHours(lowerBound.getHours() - SNAPSHOT_WINDOW_HOURS);
  return lowerBound.toISOString();
};

const formatMeasurementValue = (
  measurementName: string,
  row: HostedGen2MeasurementRow | null | undefined,
): string => {
  if (!row || row.measurement_value === null || !Number.isFinite(row.measurement_value)) {
    return "Unavailable";
  }

  const fractionDigits = normalizeText(measurementName) === "moisture_index" ? 0 : 1;
  const formattedValue = row.measurement_value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return `${formattedValue} ${row.measurement_unit ?? ""}`.trim();
};

const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return "Unavailable";
  }

  const parsedValue = new Date(value);
  return Number.isFinite(parsedValue.getTime()) ? parsedValue.toLocaleString() : "Unavailable";
};

const getSystemReportingLabel = (diagnostics: DeviceDiagnostics | null): string => {
  if (!diagnostics?.last_heartbeat_at || diagnostics.heartbeat_age_seconds === null) {
    return "Unavailable";
  }

  return diagnostics.heartbeat_age_seconds <= SYSTEM_REPORTING_FRESH_SECONDS
    ? "Reporting"
    : "Stale";
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Live snapshot is currently unavailable.";

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? "";

export default LiveDemoSnapshot;
