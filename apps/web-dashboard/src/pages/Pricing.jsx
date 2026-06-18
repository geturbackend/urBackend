import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  Zap,
  Box,
  Terminal,
  ArrowRight,
  Activity,
  Menu,
  X
} from 'lucide-react';
import Footer from '../components/Layout/Footer';
import './Pricing.css';
import './LandingPage/style.css';

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

const NAV_ITEMS = [
  { label: 'Features', href: '/#client-services', icon: Zap },
  { label: 'Use Cases', href: '/#use-cases', icon: Box },
  { label: 'Pricing', href: '/pricing', icon: Check },
  { label: 'Docs', href: 'https://docs.ub.bitbros.in', icon: Terminal, external: true }
];

export default function Pricing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.style.overflow = '';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="pricing-page">
      <div id="pricing-mobile-menu" className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link to="/#client-services" className="mobile-menu-link" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
        <Link to="/#use-cases" className="mobile-menu-link" onClick={() => setIsMobileMenuOpen(false)}>Use Cases</Link>
        <Link to="/pricing" className="mobile-menu-link" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
        <a href="https://docs.ub.bitbros.in" target="_blank" rel="noopener noreferrer" className="mobile-menu-link" onClick={() => setIsMobileMenuOpen(false)}>Docs</a>
        <div className="mobile-menu-divider"></div>
        {isAuthenticated ? (
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary mobile-menu-action">
            Go to Console
          </button>
        ) : (
          <>
            <Link to="/login" className="mobile-menu-sub-link" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
            <Link to="/signup" className="btn btn-primary mobile-menu-action" onClick={() => setIsMobileMenuOpen(false)}>Start for Free</Link>
          </>
        )}
      </div>

      <nav className={`nav-glass ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <img src="https://cdn.jsdelivr.net/gh/yash-pouranik/urBackend/apps/web-dashboard/public/LOGO_SQ.png" alt="urBackend" style={{ height: '32px', width: 'auto' }} />
              <span className="nav-logo-text">urBackend</span>
            </Link>
          </div>

          <div className="nav-links">
            {NAV_ITEMS.map((item, index) => {
              const isInternal = item.href.startsWith('/') && !item.href.startsWith('//') && !item.href.includes('#');
              const Icon = item.icon;
              let isActive = false;
              if (item.href.includes('#')) {
                const parts = item.href.split('#');
                const path = parts[0] || '/';
                const hash = parts[1];
                isActive = location.pathname === path && location.hash === '#' + hash;
              } else {
                isActive = item.href === location.pathname;
              }

              return isInternal ? (
                <Link 
                  key={index} 
                  to={item.href} 
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {Icon && <Icon size={14} />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <a 
                  key={index} 
                  href={item.href} 
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  target={item.external ? '_blank' : undefined} 
                  rel={item.external ? 'noopener noreferrer' : undefined}
                >
                  {Icon && <Icon size={14} />}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div className="nav-actions">
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="nav-btn-primary">
                <Activity size={16} />
                <span>Console</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="nav-btn-ghost">Log in</Link>
                <Link to="/signup" className="nav-btn-primary">
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="pricing-mobile-menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

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
