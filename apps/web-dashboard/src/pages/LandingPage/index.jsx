import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    Database,
    Shield,
    HardDrive,
    ArrowRight,
    CheckCircle,
    Zap,
    Lock,
    Menu,
    X,
    Terminal,
    Box,
    Layers,
    Smartphone,
    Globe as GlobeIcon,
    Cpu,
    Activity,
    ChevronDown,
    ChevronUp,
    Code,
    Check,
    Plus
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Footer from '../../components/Layout/Footer';
import './style.css';

const HERO_ENDPOINTS = [
    { method: 'GET', path: '/api/users', status: '200 OK' },
    { method: 'POST', path: '/api/users', status: '201 Created' },
    { method: 'GET', path: '/api/users/:id', status: '200 OK' },
    { method: 'PUT', path: '/api/users/:id', status: '200 OK' },
    { method: 'DELETE', path: '/api/users/:id', status: '200 OK' },
];

const HERO_CLICK_STEPS = [
    { name: 'name', type: 'String', required: true },
    { name: 'email', type: 'String', required: true },
    { name: 'role', type: 'String', required: false },
];

function LandingPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = useRef(0);
    const [scrolled, setScrolled] = useState(false);

    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const heroTimersRef = useRef([]);
    const [collectionName, setCollectionName] = useState('');
    const [heroFields, setHeroFields] = useState([]);
    const [isBuildingUi, setIsBuildingUi] = useState(false);
    const [showDeploying, setShowDeploying] = useState(false);
    const [showEndpoints, setShowEndpoints] = useState(false);
    const [activeEndpoints, setActiveEndpoints] = useState([]);

    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistStatus, setWaitlistStatus] = useState(null);
    const [waitlistMessage, setWaitlistMessage] = useState('');
    const [waitlistCount, setWaitlistCount] = useState(null);

    const bigNumberStyle = {
        position: 'absolute',
        top: '-30px',
        right: '-15px',
        fontSize: '10rem',
        fontWeight: 900,
        color: 'rgba(255, 255, 255, 0.05)',
        zIndex: 0,
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none'
    };

    const stepCardRelativeStyle = { position: 'relative', overflow: 'hidden', zIndex: 1 };

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY.current;
            setScrolled(currentScrollY > 20);

            // Show quickly on even slight upward scroll; hide only on clear downward movement.
            if (currentScrollY < 80 || delta < -2) {
                setIsNavVisible(true);
            } else if (delta > 10 && currentScrollY > 140) {
                setIsNavVisible(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);

        const fetchWaitlistCount = async () => {
            try {
                const res = await api.get('/api/waitlist/count');
                if (res.data.success) {
                    setWaitlistCount(res.data.data);
                }
            } catch {
                // Ignore silent
            }
        };
        fetchWaitlistCount();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const clearHeroTimers = () => {
        heroTimersRef.current.forEach(clearTimeout);
        heroTimersRef.current = [];
    };

    const runHeroDemo = useCallback(() => {
        clearHeroTimers();

        // Wrap initial state updates in setTimeout to avoid synchronous setState inside useEffect
        setTimeout(() => {
            setCollectionName('');
            setHeroFields([]);
            setIsBuildingUi(true);
            setShowDeploying(false);
            setShowEndpoints(false);
            setActiveEndpoints([]);
        }, 0);

        heroTimersRef.current.push(setTimeout(() => setCollectionName('users'), 400));
        heroTimersRef.current.push(setTimeout(() => setHeroFields([HERO_CLICK_STEPS[0]]), 900));
        heroTimersRef.current.push(setTimeout(() => setHeroFields([HERO_CLICK_STEPS[0], HERO_CLICK_STEPS[1]]), 1400));
        heroTimersRef.current.push(setTimeout(() => setHeroFields(HERO_CLICK_STEPS), 1900));
        heroTimersRef.current.push(setTimeout(() => setIsBuildingUi(false), 2200));
        heroTimersRef.current.push(setTimeout(() => setShowDeploying(true), 2500));
        heroTimersRef.current.push(setTimeout(() => {
            setShowDeploying(false);
            setShowEndpoints(true);
            HERO_ENDPOINTS.forEach((_, index) => {
                const timer = setTimeout(() => {
                    setActiveEndpoints(prev => [...prev, index]);
                }, index * 160);
                heroTimersRef.current.push(timer);
            });
        }, 3600));
    }, []);

    useEffect(() => {
        runHeroDemo();
        return () => clearHeroTimers();
    }, [runHeroDemo]);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const handleWaitlistSubmit = async (e) => {
        e.preventDefault();
        if (!waitlistEmail) return;
        setWaitlistStatus('loading');
        try {
            const res = await api.post('/api/waitlist', { email: waitlistEmail });
            if (res.data.success) {
                setWaitlistStatus('success');
                setWaitlistMessage("Added to waitlist! We'll email you when Pro launches.");
                setWaitlistEmail('');
                if (waitlistCount !== null) setWaitlistCount(prev => prev + 1);
            }
        } catch (err) {
            setWaitlistStatus('error');
            setWaitlistMessage(err.response?.data?.message || err.response?.data?.error || "Something went wrong.");
        }
    };

    return (
        <div className="landing-page">
            <div className="grid-bg">
                <div className="hero-lines"></div>
                <div className="hero-particles">
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                </div>
            </div>

            <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
                <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>How it Works</a>
                <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Features</a>
                <a href="#use-cases" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Use Cases</a>
                <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>FAQ</a>
                <div style={{ height: '1px', width: '60px', background: '#333', margin: '10px 0' }}></div>
                {isAuthenticated ? (
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ fontWeight: 600, width: '200px', padding: '12px' }}>
                        Go to Console
                    </button>
                ) : (
                    <>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.2rem', fontWeight: 500, color: '#aaa', textDecoration: 'none' }}>Log in</Link>
                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ fontWeight: 600, padding: '12px 30px', width: '200px', textAlign: 'center' }}>Start for Free</Link>
                    </>
                )}
            </div>

            <nav className={`nav-glass ${!isNavVisible ? 'nav-hidden' : ''} ${scrolled ? 'nav-scrolled' : ''}`}>
                <div className="nav-container">
                    <div className="nav-logo">
                        <img src="https://cdn.jsdelivr.net/gh/yash-pouranik/urBackend/apps/web-dashboard/public/LOGO_SQ.png" alt="urBackend" style={{ height: '40px', width: 'auto' }} />
                    </div>

                    <div className="nav-links">
                        <a href="#features" className="nav-link">
                            <Zap size={16} />
                            <span>Features</span>
                        </a>
                        <a href="#use-cases" className="nav-link">
                            <Box size={16} />
                            <span>Use Cases</span>
                        </a>
                        <a href="https://docs.urbackend.bitbros.in" target="_blank" rel="noopener noreferrer" className="nav-link">
                            <Terminal size={16} />
                            <span>Docs</span>
                        </a>
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
                        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="hero-section">
                <div className="hero-glow"></div>

                <div className="status-pill">
                    <div className="status-dot"></div>
                    <span>Zero Config. Zero Boilerplate.</span>
                </div>

                <Motion.h1 
                    className="hero-heading"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    From Clicks to <span className="shine-text">Secure APIs</span> in seconds.
                </Motion.h1>

                <Motion.p 
                    className="hero-sub"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    Create collections with a few UI clicks, and ship production-ready REST APIs instantly.
                </Motion.p>

                <Motion.div 
                    style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 10, position: 'relative' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                >
                    <Link to="/signup" className="btn-hero-primary">
                        Start Building <ArrowRight size={18} strokeWidth={2} />
                    </Link>
                    <Link to="/docs" className="btn-hero-secondary">
                        Documentation <ArrowRight size={18} strokeWidth={2} />
                    </Link>
                </Motion.div>

                <Motion.div 
                    className="hero-interactive-window"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                >
                    <div className="lh-header">
                        <div className="lh-dots">
                            <span className="lh-dot lh-dot-red"></span>
                            <span className="lh-dot lh-dot-yellow"></span>
                            <span className="lh-dot lh-dot-green"></span>
                        </div>
                        <div className="lh-title">
                            <Terminal size={14} />
                            <span>urBackend Studio</span>
                        </div>
                        <button className="lh-replay" onClick={runHeroDemo}>↻ Replay</button>
                    </div>

                    <div className="lh-content">
                        <div className="lh-pane">
                            <div className="lh-pane-header">
                                <Database size={14} />
                                <span>Collection Builder</span>
                                <span className="lh-pane-label">UI Mode</span>
                            </div>
                            <div className="lh-builder">
                                <div className="lh-group">
                                    <label>Name</label>
                                    <div className="lh-input">{collectionName || 'users'}</div>
                                </div>
                                <div className="lh-head-row">
                                    <span>NAME</span>
                                    <span>TYPE</span>
                                    <span>REQ</span>
                                </div>
                                <div className="lh-table">
                                    {heroFields.map((field, index) => (
                                        <Motion.div
                                            key={field.name}
                                            className="lh-row"
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.25, delay: index * 0.08 }}
                                        >
                                            <span className="lh-name">{field.name}</span>
                                            <span className="lh-type">{field.type}</span>
                                            <span className={`lh-req ${field.required ? 'on' : 'off'}`}>
                                                {field.required ? <Check size={12} /> : '—'}
                                            </span>
                                        </Motion.div>
                                    ))}
                                </div>
                                <div className="lh-actions">
                                    <button type="button" className="lh-add-btn"><Plus size={12} />Add Column</button>
                                    {isBuildingUi && <span className="lh-live">Auto-clicking...</span>}
                                </div>
                            </div>
                        </div>

                        <div className="lh-middle">
                            <div className="lh-line">
                                <Motion.div
                                    className="lh-pulse"
                                    animate={{ x: showDeploying ? [0, 92] : 0, opacity: showDeploying ? [1, 0] : 0.35 }}
                                    transition={{ duration: 1.2, repeat: showDeploying ? 0 : Infinity, repeatDelay: 1 }}
                                />
                            </div>
                            <AnimatePresence>
                                {showDeploying && (
                                    <Motion.div className="lh-deploying" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                        <Zap size={12} />
                                        <span>Deploying...</span>
                                    </Motion.div>
                                )}
                            </AnimatePresence>
                            <div className="lh-engine"><Cpu size={20} /></div>
                        </div>

                        <div className="lh-pane lh-pane-right">
                            <div className="lh-pane-header">
                                <Code size={14} />
                                <span>Generated APIs</span>
                                <span className="lh-pane-label">endpoints</span>
                            </div>
                            <div className="lh-endpoints">
                                {showEndpoints ? HERO_ENDPOINTS.map((endpoint, index) => (
                                    <Motion.div
                                        key={`${endpoint.method}-${endpoint.path}`}
                                        className={`lh-endpoint ${activeEndpoints.includes(index) ? 'active' : ''}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.12 }}
                                    >
                                        <span className={`lh-method ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                                        <code>{endpoint.path}</code>
                                        <span className="lh-status"><Check size={12} />{endpoint.status}</span>
                                    </Motion.div>
                                )) : (
                                    <div className="lh-empty">
                                        <Terminal size={28} />
                                        <p>Waiting for UI actions...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Motion.div>
            </div>

            <div className="integration-section" style={{ padding: '4rem 0', background: '#030303', textAlign: 'center' }}>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Integrates with your favorite stack</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3rem', opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}><Smartphone size={20} /> Flutter</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}><Layers size={20} /> React</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}><Box size={20} /> Vue</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}><Activity size={20} /> Next.js</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}><GlobeIcon size={20} /> Webflow</div>
                </div>
            </div>

            <div id="how-it-works" style={{ padding: '6rem 0', background: '#030303', borderTop: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}>
                <div className="section-glow" style={{ top: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(64,158,255,0.06) 0%, transparent 70%)' }}></div>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 className="section-title">Backend Architecture, Simplified.</h2>
                        <p className="section-desc">We handle the complex infrastructure so you can ship professional apps faster.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div className="step-card" style={stepCardRelativeStyle}>
                            <div style={bigNumberStyle}>1</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', position: 'relative', zIndex: 2 }}>Init Project</h3>
                            <p style={{ color: '#888', lineHeight: 1.6, position: 'relative', zIndex: 2 }}>
                                Instantly provision a dedicated, isolated backend environment.
                                We set up your MongoDB cluster, Storage buckets, and API Gateway automatically.
                            </p>
                        </div>
                        <div className="step-card" style={stepCardRelativeStyle}>
                            <div style={bigNumberStyle}>2</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', position: 'relative', zIndex: 2 }}>Design Schema</h3>
                            <p style={{ color: '#888', lineHeight: 1.6, position: 'relative', zIndex: 2 }}>
                                Use our Visual Builder to model your data.
                                We strictly validate your JSON Schema and handle complex relationships behind the scenes.
                            </p>
                        </div>
                        <div className="step-card" style={stepCardRelativeStyle}>
                            <div style={bigNumberStyle}>3</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', position: 'relative', zIndex: 2 }}>Connect API</h3>
                            <p style={{ color: '#888', lineHeight: 1.6, position: 'relative', zIndex: 2 }}>
                                Your secure REST endpoints are live instantly.
                                Connect from React, Vue, or Mobile apps using standard HTTP methods with low latency.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="features" style={{ padding: '8rem 0', background: '#030303', borderTop: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', overflow: 'hidden' }}>
                <div className="section-glow" style={{ bottom: '-10%', left: '-10%', background: 'radial-gradient(circle, rgba(0, 245, 212, 0.06) 0%, transparent 70%)' }}></div>
                <div style={{ textAlign: 'center', marginBottom: '5rem', position: 'relative', zIndex: 1 }}>
                    <h2 className="section-title">Complete Backend Suite</h2>
                    <p className="section-desc">Enterprise-grade tools packaged for individual developers.</p>
                </div>

                <div className="bento-grid">
                    <div className="bento-item bento-span-8">
                        <div>
                            <div className="bento-icon" style={{ background: 'rgba(0, 245, 212, 0.1)', color: '#00f5d4', boxShadow: '0 0 20px rgba(0, 245, 212, 0.2)' }}>
                                <Database strokeWidth={1.5} />
                            </div>
                            <h3 className="bento-title">Managed NoSQL Database</h3>
                            <p className="bento-desc">
                                High-performance document storage powered by MongoDB.
                                Scale from 10 to 10M records without managing servers.
                            </p>
                            <ul style={{ marginTop: '1rem', color: '#666', listStyle: 'none', padding: 0, display: 'grid', gap: '8px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#00f5d4" /> Strict Type Validation</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#00f5d4" /> Auto-generated API Endpoints</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#00f5d4" /> Real-time Indexing</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bento-item bento-span-4">
                        <div className="bento-icon" style={{ background: 'rgba(255, 189, 46, 0.1)', color: '#FFBD2E', boxShadow: '0 0 20px rgba(255, 189, 46, 0.2)' }}>
                            <Shield strokeWidth={1.5} />
                        </div>
                        <h3 className="bento-title">Secure Auth</h3>
                        <p className="bento-desc">
                            Full authentication flow with JWTs, BCrypt hashing, and session management built-in.
                        </p>
                        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#888' }}>
                            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Encrypted Passwords</div>
                            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> Role Based Access</div>
                        </div>
                    </div>

                    <div className="bento-item bento-span-4">
                        <div className="bento-icon" style={{ background: 'rgba(64, 158, 255, 0.1)', color: '#409EFF', boxShadow: '0 0 20px rgba(64, 158, 255, 0.2)' }}>
                            <HardDrive strokeWidth={1.5} />
                        </div>
                        <h3 className="bento-title">Global Storage</h3>
                        <p className="bento-desc">
                            Upload and serve media assets via global CDN. Supports images, documents, and videos.
                        </p>
                    </div>

                    <div className="bento-item bento-span-8">
                        <div>
                            <div className="bento-icon" style={{ background: 'rgba(255, 95, 86, 0.1)', color: '#FF5F56', boxShadow: '0 0 20px rgba(255, 95, 86, 0.2)' }}>
                                <Cpu strokeWidth={1.5} />
                            </div>
                            <h3 className="bento-title">Serverless Architecture</h3>
                            <p className="bento-desc">
                                Built on modern Node.js clusters. We isolate your project to ensure
                                consistent performance and security.
                            </p>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ background: '#1a1a1a', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#888' }}>Auto-scaling</span>
                            <span style={{ background: '#1a1a1a', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#888' }}>DDoS Protection</span>
                            <span style={{ background: '#1a1a1a', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#888' }}>99.9% Uptime</span>
                        </div>
                    </div>
                </div>
            </div>

            <div id="byod" style={{ padding: '8rem 0', background: '#000', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 className="section-title">Bring Your Own Infrastructure</h2>
                        <p className="section-desc">Already have a database? Connect your existing MongoDB or S3 bucket and get instant APIs.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '3rem', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '12px', background: 'rgba(0, 245, 212, 0.1)', borderRadius: '12px', color: '#00f5d4', boxShadow: '0 0 20px rgba(0, 245, 212, 0.2)' }}>
                                    <Database strokeWidth={1.5} size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>BYO Database</h3>
                            </div>
                            <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Connect your self-hosted MongoDB or Atlas cluster. We provide the instant API layer, auth, and validation schema, while you keep full ownership of the data.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <span className="hero-pill" style={{ margin: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa' }}>MongoDB Atlas</span>
                                <span className="hero-pill" style={{ margin: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa' }}>Self-Hosted</span>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '3rem', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '12px', background: 'rgba(64, 158, 255, 0.1)', borderRadius: '12px', color: '#409EFF', boxShadow: '0 0 20px rgba(64, 158, 255, 0.2)' }}>
                                    <HardDrive strokeWidth={1.5} size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>BYO Storage</h3>
                            </div>
                            <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Link your supabase buckets or Supabase Storage. We handle the file upload tokens, permissions, and CDN delivery automatically.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <span className="hero-pill" style={{ margin: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa' }}>Supabase</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="use-cases" style={{ padding: '8rem 0', background: '#000', borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 className="section-title">Build Anything.</h2>
                        <p className="section-desc">Scalable infrastructure for every type of application.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '6rem' }}>
                        <div className="use-case-card">
                            <Layers strokeWidth={1.5} size={32} color="#facc15" style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>SaaS Platforms</h3>
                            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Handle complex data relationships, multi-tenant auth, and subscriptions securely.</p>
                        </div>
                        <div className="use-case-card">
                            <Smartphone strokeWidth={1.5} size={32} color="#409EFF" style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>Mobile Backends</h3>
                            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Serve data to Flutter or React Native apps with lightweight, fast JSON responses.</p>
                        </div>
                        <div className="use-case-card">
                            <GlobeIcon strokeWidth={1.5} size={32} color="#FFBD2E" style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>Content Sites</h3>
                            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Power blogs, portfolios, and e-commerce catalogs without CMS bloat.</p>
                        </div>
                    </div>


                </div>
            </div>

            <div id="pricing" style={{ padding: '8rem 0', background: '#030303', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 className="section-title">Transparent Pricing</h2>
                        <p className="section-desc">Start building for free. Scale as you grow.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                        <div className="pricing-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', padding: '3rem', borderRadius: '16px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0, 245, 212, 0.1)', color: '#00f5d4', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>ACTIVE</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Developer Beta</h3>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>$0<span style={{ fontSize: '1rem', color: '#666', fontWeight: 400 }}>/mo</span></div>
                            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.95rem' }}>Perfect for side projects, MVPs, and learning.</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'grid', gap: '12px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#00f5d4" /> Create 1 free project</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#00f5d4" /> 500MB Storage</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#00f5d4" /> Community Support</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#00f5d4" /> BYO Infrastructure</li>
                            </ul>
                            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', padding: '12px', fontWeight: 600 }}>Get Started Now</Link>
                        </div>

                        <div className="pricing-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '3rem', borderRadius: '16px', opacity: 0.8 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Pro Plan</h3>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#666', marginBottom: '1rem' }}>Coming<span style={{ fontSize: '1rem', color: '#444', fontWeight: 400 }}> Soon</span></div>
                            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.95rem' }}>For growing teams and production-grade apps.</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'grid', gap: '12px', opacity: 0.5 }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }}><CheckCircle size={16} /> Custom Domains</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }}><CheckCircle size={16} /> Advanced Analytics</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }}><CheckCircle size={16} /> Priority Support</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }}><CheckCircle size={16} /> Automated Backups</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="cta-section">
                <div className="cta-container">
                    <div className="cta-badge">
                        <Zap size={16} strokeWidth={2.5} />
                        <span>Start Building Today</span>
                    </div>
                    
                    <h2 className="cta-heading">
                        Ship faster. Scale smarter.
                    </h2>
                    
                    <p className="cta-description">
                        Your MongoDB. Instant REST APIs. Built-in Auth. Zero backend hassle.
                    </p>
                    
                    <div className="cta-buttons">
                        <Link to="/signup" className="cta-btn-primary">
                            <span>Get Started Free</span>
                            <ArrowRight size={18} strokeWidth={2.5} />
                        </Link>
                        <Link to="/login" className="cta-btn-secondary">
                            <Terminal size={18} strokeWidth={2} />
                            <span>Go to Console</span>
                        </Link>
                    </div>

                    <div className="cta-waitlist" style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem', fontWeight: 600 }}>Get 1 month Pro free at launch. Join the waitlist.</h3>
                        <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', gap: '8px', justifyContent: 'center', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap' }}>
                            <input 
                                type="email" 
                                placeholder="developer@example.com"
                                value={waitlistEmail}
                                onChange={(e) => setWaitlistEmail(e.target.value)}
                                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none', flex: '1 1 200px' }}
                                required
                                disabled={waitlistStatus === 'loading'}
                            />
                            <button type="submit" disabled={waitlistStatus === 'loading'} style={{ background: '#fff', color: '#000', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', flex: '0 0 auto' }}>
                                {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}
                            </button>
                        </form>
                        {waitlistMessage && <p style={{ marginTop: '1rem', color: waitlistStatus === 'success' ? '#00f5d4' : '#ff5f56', fontSize: '0.95rem' }}>{waitlistMessage}</p>}
                        {waitlistCount !== null && (
                            <p style={{ marginTop: '0.5rem', color: '#888', fontSize: '0.85rem' }}>🔥 {waitlistCount} developers already waiting</p>
                        )}
                    </div>
                </div>
            </div>

            <div id="faq" style={{ padding: '8rem 0', background: '#030303', borderTop: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', overflow: 'hidden' }}>
                <div className="section-glow" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(64,158,255,0.04) 0%, transparent 70%)' }}></div>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="section-title">Common Questions</h2>
                    </div>

                    <div className="faq-list">
                        {[
                            { q: "Is it really free?", a: "Yes, our Public Beta is free for developers. New accounts can create 1 free project while we refine the platform." },
                            { q: "Can I use this for production?", a: "While we are stable, we recommend urBackend for side-projects, hackathons, and MVPs initially." },
                            { q: "Can I use this with React/Next.js?", a: "Yes. urBackend outputs standard REST APIs, so it works with any frontend framework. However, since the API Key grants write access, we recommend calling it from a server-side environment (like Next.js API routes) to keep your key secure." },
                            { q: "How does it handle security?", a: "We use industry-standard encryption, automatic API key validation, and JWT for user sessions." },
                            { q: "Can I export my data?", a: "Your data is yours. We provide simple JSON export tools if you ever decide to migrate." }
                        ].map((faq, index) => (
                            <div key={index} className="faq-item">
                                <div className="faq-question" onClick={() => toggleFaq(index)}>
                                    <span>{faq.q}</span>
                                    {openFaqIndex === index ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
                                </div>
                                {openFaqIndex === index && (
                                    <div className="faq-answer">{faq.a}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default LandingPage;
