import { lazy, Suspense } from "react";
import SensorLogViewer from "./components/SensorLogViewer";

const isHostedReadonlyMode =
  import.meta.env.VITE_MBG_DASHBOARD_MODE === "hosted-readonly";

const LiveStats = isHostedReadonlyMode
  ? null
  : lazy(() => import("./components/LiveStats"));

function App() {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "'Roboto', Arial, sans-serif",
        background: "linear-gradient(to bottom, #a8e063, #56ab2f)",
        color: "white",
        minHeight: "100vh",
      }}
    >
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

      {isHostedReadonlyMode && (
        <section
          aria-label="Hosted read-only dashboard status"
          style={{
            maxWidth: "900px",
            margin: "0 auto 2rem",
            padding: "1rem 1.25rem",
            border: "1px solid rgba(255, 255, 255, 0.45)",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.16)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", textAlign: "center" }}>
            Garden check-in mode
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            You’re viewing the latest watering and sensor history for this
            garden. This page is for checking in from anywhere, so watering
            controls stay safely on the local garden device.
          </p>
        </section>
      )}

      {/* Sensor Logs Component */}
      <SensorLogViewer />

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
    </main>
  );
}

export default App;
