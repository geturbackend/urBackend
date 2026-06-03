import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Footer from '../components/Layout/Footer';
import './Pricing.css';

const FREE_FEATURES = [
  '1 Project',
  '5 Collections per project',
  '2,000 API requests / day',
  '10MB File Storage',
  '200 Auth Users',
  '25 Emails / month',
  'Global email templates',
  'Community support',
];

const PRO_FEATURES = [
  '10 Projects',
  'Unlimited collections',
  'Unlimited API requests',
  'Unlimited Auth Users',
  'Unlimited Webhooks',
  'External Database (BYOM)',
  'Bring your own Storage (S3/R2)',
  '1,000 Emails / month',
  'Custom HTML email templates',
  'BYOK — own API keys',
  'Analytics Pro',
  'AI integrations (OpenAI, Groq)',
  'Priority support',
];

export default function Pricing() {
  return (
    <div className="pricing-page">
      <header className="pricing-header">
        <div className="pricing-header-inner">
          <Link to="/" className="pricing-logo">
            urBackend
          </Link>
          <div className="pricing-header-links">
            <Link to="/docs" className="pricing-link">Docs</Link>
            <Link to="/login" className="pricing-link">Log in</Link>
            <Link to="/signup" className="pricing-cta">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="pricing-main">
        <div className="pricing-hero">
          <h1>Simple pricing for every stage</h1>
        </div>

        <div className="pricing-grid">
          <section className="pricing-card">
            <div className="pricing-badge">Free</div>
            <h2>Developer Beta</h2>
            <div className="pricing-price">
              <span className="pricing-amount">$0</span>
              <span className="pricing-term">/mo</span>
            </div>
            <p className="pricing-subtext">Perfect for side projects, MVPs, and learning.</p>
            <ul className="pricing-list">
              {FREE_FEATURES.map((feature) => (
                <li key={feature}>
                  <Check size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup" className="pricing-button">
              Start for Free
            </Link>
          </section>

          <section className="pricing-card pricing-card-highlight">
            <div className="pricing-badge">Pro (Beta)</div>
            <h2>Pro</h2>
            <div className="pricing-price">
              <span className="pricing-amount pricing-amount-strike">$9</span>
              <span className="pricing-term">/mo</span>
            </div>
            <p className="pricing-subtext pricing-free-trial">Try now free for a month</p>
            <ul className="pricing-list">
              {PRO_FEATURES.map((feature) => (
                <li key={feature}>
                  <Check size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/request-pro" className="pricing-button pricing-button-green">
              Get 1 month Pro for free
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
