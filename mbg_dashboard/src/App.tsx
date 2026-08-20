import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import SensorLogViewer, { type DemoGuideTarget } from "./components/SensorLogViewer";
import PublicLandingPage, { LoginModal } from "./components/PublicLandingPage";
import LoginPanel from "./components/LoginPanel";
import {
  getCurrentSession,
  onAuthSessionChange,
  signOut as signOutUser,
} from "./auth";
import type { Session } from "@supabase/supabase-js";
import "./App.css";

const isHostedReadonlyMode =
  import.meta.env.VITE_MBG_DASHBOARD_MODE === "hosted-readonly";

const LiveStats = isHostedReadonlyMode
  ? null
  : lazy(() => import("./components/LiveStats"));

function App() {
  if (isHostedReadonlyMode) {
    return <HostedReadonlyRoutes />;
  }

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

const HostedReadonlyRoutes = () => {
  const routePath = getRoutePath();
  const [isLoginOpen, setIsLoginOpen] = useState(routePath === "/login");
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDemoGuide, setShowDemoGuide] = useState(true);
  const [activeDemoGuideTarget, setActiveDemoGuideTarget] =
    useState<DemoGuideTarget>("readings");

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const currentSession = await getCurrentSession();

        if (!isMounted) {
          return;
        }

        setSession(currentSession);
        setAuthError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAuthError(error instanceof Error ? error.message : "Auth is unavailable.");
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void loadSession();

    const unsubscribe = onAuthSessionChange((nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
      setAuthError(null);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSignedIn = () => {
    setIsLoginOpen(false);
    window.location.assign(getLoginRedirectPath(routePath));
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setSession(null);
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign out failed.");
    }
  };

  if (routePath === "/demo") {
    const highlightedDemoGuideTarget = showDemoGuide ? activeDemoGuideTarget : undefined;

    return (
      <HostedPageShell
        eyebrow="Live Demo"
        title="Live garden data from Jeremy's balcony"
        description="A detailed look at real growing conditions"
        onLoginClick={() => setIsLoginOpen(true)}
        onSignOut={handleSignOut}
        session={session}
        isLoginOpen={isLoginOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignedIn={handleSignedIn}
      >
        {showDemoGuide ? (
          <DemoGuide
            activeTarget={activeDemoGuideTarget}
            onActiveTargetChange={setActiveDemoGuideTarget}
            onDismiss={() => setShowDemoGuide(false)}
          />
        ) : null}
        <SensorLogViewer
          demoGuideTarget={highlightedDemoGuideTarget}
          isHostedReadonly
          showHostedSiteHeader={false}
        />
      </HostedPageShell>
    );
  }

  if (routePath === "/mygarden" || routePath === "/app") {
    return (
      <HostedPageShell
        eyebrow="My Garden"
        title="My Garden"
        description="Online garden dashboard"
        onLoginClick={() => setIsLoginOpen(true)}
        onSignOut={handleSignOut}
        session={session}
        isLoginOpen={isLoginOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignedIn={handleSignedIn}
      >
        <ProtectedRouteState
          authError={authError}
          isAuthLoading={isAuthLoading}
          message="Sign in to view your assigned garden dashboard."
          onSignedIn={() => window.location.assign("/mygarden")}
          session={session}
          title="Garden access"
        >
          <SensorLogViewer
            emptyStateMessage="No garden is assigned to this account yet."
            isHostedReadonly
            hostedReadonlyScope="customer"
            showHostedSiteHeader={false}
          />
        </ProtectedRouteState>
      </HostedPageShell>
    );
  }

  if (routePath === "/login") {
    return <PublicLandingPage initialLoginOpen onSignedIn={() => window.location.assign("/mygarden")} />;
  }

  if (routePath === "/support") {
    return (
      <HostedPageShell
        eyebrow="Support"
        title="Support View"
        description="Review connected garden units and recent readings."
        onLoginClick={() => setIsLoginOpen(true)}
        onSignOut={handleSignOut}
        session={session}
        isLoginOpen={isLoginOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignedIn={handleSignedIn}
      >
        <ProtectedRouteState
          authError={authError}
          isAuthLoading={isAuthLoading}
          message="Sign in with a support/admin account to view support data."
          onSignedIn={() => window.location.assign("/support")}
          session={session}
          title="Support access"
        >
          <SensorLogViewer
            emptyStateMessage="Support access is not available for this account."
            isHostedReadonly
            hostedReadonlyScope="support"
            showHostedSiteHeader={false}
          />
        </ProtectedRouteState>
      </HostedPageShell>
    );
  }

  return <PublicLandingPage onSignedIn={() => window.location.assign("/mygarden")} />;
};

type HostedPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  isLoginOpen: boolean;
  onLoginClick: () => void;
  onLoginClose: () => void;
  onSignedIn: () => void;
  onSignOut: () => void;
  session: Session | null;
};

const HostedPageShell = ({
  eyebrow,
  title,
  description,
  children,
  isLoginOpen,
  onLoginClick,
  onLoginClose,
  onSignedIn,
  onSignOut,
  session,
}: HostedPageShellProps) => (
  <main className="hosted-route">
    <SiteNav onLoginClick={onLoginClick} onSignOut={onSignOut} session={session} />
    <section className="hosted-route-heading" aria-label={eyebrow}>
      <h1>{title}</h1>
      <span>{description}</span>
    </section>
    <div className="dashboard-shell hosted-dashboard-shell">{children}</div>
    <LoginModal isOpen={isLoginOpen} onClose={onLoginClose} onSignedIn={onSignedIn} />
  </main>
);

type ProtectedRouteStateProps = {
  authError: string | null;
  children: ReactNode;
  isAuthLoading: boolean;
  message: string;
  onSignedIn: () => void;
  session: Session | null;
  title: string;
};

const ProtectedRouteState = ({
  authError,
  children,
  isAuthLoading,
  message,
  onSignedIn,
  session,
  title,
}: ProtectedRouteStateProps) => {
  if (isAuthLoading) {
    return (
      <section className="hosted-access-state" aria-label={title}>
        <p>Checking access...</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="hosted-access-state" aria-label={title}>
        <LoginPanel heading={title} message={message} onSignedIn={onSignedIn} />
        {authError ? <p className="hosted-access-error">{authError}</p> : null}
      </section>
    );
  }

  return <>{children}</>;
};

type DemoGuideStep = {
  target: DemoGuideTarget;
  label: string;
};

const DEMO_GUIDE_STEPS: DemoGuideStep[] = [
  { target: "readings", label: "Check current garden readings." },
  { target: "status", label: "Open device status and diagnostics." },
  { target: "device", label: "Change between garden units." },
  { target: "window", label: "Change the history window." },
  { target: "chart", label: "Choose which readings appear on the chart." },
];

const DEMO_GUIDE_INTERVAL_MS = 3600;

type DemoGuideProps = {
  activeTarget: DemoGuideTarget;
  onActiveTargetChange: (target: DemoGuideTarget) => void;
  onDismiss: () => void;
};

const DemoGuide = ({ activeTarget, onActiveTargetChange, onDismiss }: DemoGuideProps) => {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const advanceTimer = window.setInterval(() => {
      onActiveTargetChange(getNextDemoGuideTarget(activeTarget));
    }, DEMO_GUIDE_INTERVAL_MS);

    return () => {
      window.clearInterval(advanceTimer);
    };
  }, [activeTarget, onActiveTargetChange]);

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <section className="demo-guide" aria-label="Demo guide">
      <div>
        <h2>What you can do here</h2>
        <ul>
          {DEMO_GUIDE_STEPS.map((step, index) => (
            <li key={step.target}>
              <button
                aria-current={activeTarget === step.target ? "step" : undefined}
                className={activeTarget === step.target ? "is-active" : undefined}
                onClick={() => onActiveTargetChange(step.target)}
                type="button"
              >
                <span>{index + 1}</span>
                {step.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button
        className="demo-guide-close"
        aria-label="Dismiss demo guide"
        onClick={handleDismiss}
        type="button"
      >
        Close
      </button>
    </section>
  );
};

const getNextDemoGuideTarget = (currentTarget: DemoGuideTarget): DemoGuideTarget => {
  const currentIndex = DEMO_GUIDE_STEPS.findIndex((step) => step.target === currentTarget);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % DEMO_GUIDE_STEPS.length : 0;
  return DEMO_GUIDE_STEPS[nextIndex].target;
};

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

type SiteNavProps = {
  onLoginClick: () => void;
  onSignOut: () => void;
  session: Session | null;
};

const SiteNav = ({ onLoginClick, onSignOut, session }: SiteNavProps) => (
  <nav className="site-nav" aria-label="Primary">
    <a className="site-nav-brand" href="/">
      My Balcony Gardener
    </a>
    <div className="site-nav-links">
      <a href="/demo">Demo</a>
      <a href="/mygarden">My Garden</a>
      {session ? (
        <button className="site-nav-login" onClick={onSignOut} type="button">
          Sign out
        </button>
      ) : (
        <button className="site-nav-login" onClick={onLoginClick} type="button">
          Login
        </button>
      )}
    </div>
  </nav>
);

const getRoutePath = (): string => {
  const pathname = window.location.pathname.replace(/\/+$/, "");
  return pathname === "" ? "/" : pathname;
};

const getLoginRedirectPath = (routePath: string): string =>
  routePath === "/support" ? "/support" : "/mygarden";

export default App;
