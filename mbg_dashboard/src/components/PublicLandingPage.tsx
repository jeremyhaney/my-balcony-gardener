import LiveDemoSnapshot from "./LiveDemoSnapshot";
import "./PublicLandingPage.css";
import { useState } from "react";
import LoginPanel from "./LoginPanel";

type PublicLandingPageProps = {
  initialLoginOpen?: boolean;
  onSignedIn?: () => void;
};

const PublicLandingPage = ({
  initialLoginOpen = false,
  onSignedIn,
}: PublicLandingPageProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(initialLoginOpen);

  return (
    <main className="public-landing">
      <nav className="public-landing-nav" aria-label="Primary">
        <a className="public-landing-brand" href="/">
          My Balcony Gardener
        </a>
        <div className="public-landing-nav-links">
          <a href="/demo">Live Example</a>
          <a href="/mygarden">My Garden</a>
          <button
            className="public-landing-login"
            onClick={() => setIsLoginOpen(true)}
            type="button"
          >
            Login
          </button>
        </div>
      </nav>

      <section className="public-landing-hero" aria-label="My Balcony Gardener">
        <div className="public-landing-copy">
          <h1>
            Automated balcony watering.
            <span>Live garden data.</span>
          </h1>
          <p className="public-landing-value-line">
            Reservoir-fed watering for balconies without an outdoor spigot.
          </p>
          <p>
            Monitor current conditions and watering history from your garden.
          </p>
          <a className="public-landing-primary-action" href="/demo">
            View live garden example
          </a>
        </div>

        <LiveDemoSnapshot />
      </section>

      <section className="public-landing-section" aria-label="How it works">
        <div>
          <p className="public-landing-section-label">How it works</p>
          <h2>The garden unit keeps watch while the online dashboard shows how things are doing.</h2>
        </div>
        <ol className="public-landing-steps">
          <li>Sensors measure real growing conditions.</li>
          <li>The garden unit keeps watering consistent.</li>
          <li>The online dashboard shows how the garden is doing.</li>
        </ol>
      </section>

      <section className="public-landing-proof" aria-label="Garden proof">
        <article>
          <h2>Real garden data</h2>
          <p>Live readings come from Jeremy's Balcony.</p>
        </article>
        <article>
          <h2>Built for balconies</h2>
          <p>Designed around container gardens and small outdoor spaces.</p>
        </article>
        <article>
          <h2>Early customer access</h2>
          <p>Customer dashboards and support tools are being shaped next.</p>
        </article>
      </section>

      <section className="public-landing-video" aria-label="Demo video">
        <p>Demo video coming soon</p>
      </section>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSignedIn={onSignedIn}
      />
    </main>
  );
};

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
};

export const LoginModal = ({ isOpen, onClose, onSignedIn }: LoginModalProps) => {
  if (!isOpen) {
    return null;
  }

  const handleSignedIn = () => {
    onSignedIn?.();
    onClose();
  };

  return (
    <div
      aria-labelledby="customer-login-title"
      aria-modal="true"
      className="public-login-modal-backdrop"
      role="dialog"
    >
      <section className="public-login-modal">
        <LoginPanel
          heading="Customer access"
          message="Sign in with your My Balcony Gardener account."
          onSignedIn={handleSignedIn}
        />
        <button className="public-login-modal-close" onClick={onClose} type="button">
          Close
        </button>
      </section>
    </div>
  );
};

export default PublicLandingPage;
