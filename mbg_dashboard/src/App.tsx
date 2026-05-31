import { lazy, Suspense } from "react";
import SensorLogViewer from "./components/SensorLogViewer";

const isHostedReadonlyMode =
  import.meta.env.VITE_MBG_DASHBOARD_MODE === "hosted-readonly";

const LiveStats = isHostedReadonlyMode
  ? null
  : lazy(() => import("./components/LiveStats"));

const LiveMeasurements = isHostedReadonlyMode
  ? null
  : lazy(() => import("./components/LiveMeasurements"));

function App() {
  return (
    <main
      style={{
        padding: "2rem 0",
        fontFamily: "'Roboto', Arial, sans-serif",
        background: "linear-gradient(to bottom, #a8e063, #56ab2f)",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <div className="dashboard-shell">
        {/* Header Section */}
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "3rem", margin: 0 }}>🪴 My Balcony Gardener</h1>
          <p style={{ fontSize: "1.2rem", fontStyle: "italic" }}>
            Your personal assistant for plant care and weather insights
          </p>
        </header>

        {/* Live Stats Component */}
        {!isHostedReadonlyMode && LiveStats && (
          <Suspense fallback={<div>Loading live stats...</div>}>
            <LiveStats />
          </Suspense>
        )}

        {!isHostedReadonlyMode && LiveMeasurements && (
          <Suspense fallback={<div>Loading LiveMeasurements...</div>}>
            <LiveMeasurements />
          </Suspense>
        )}

        {/* Sensor Logs Component */}
        <SensorLogViewer isHostedReadonly={isHostedReadonlyMode} />

        {/* Footer Section */}
        <footer
          style={{
            textAlign: "center",
            marginTop: "2rem",
            fontSize: "0.9rem",
            opacity: 0.8,
          }}
        >
          <p>🌱 Built with love for gardening enthusiasts</p>
          <p>
            © {new Date().getFullYear()} My Balcony Gardener |{" "}
            <a
              href="https://github.com/your-repo"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "white", textDecoration: "underline" }}
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;
