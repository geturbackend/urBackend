import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    Play
} from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import Footer from '../../components/Layout/Footer';
import './style.css';

function LandingPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = useRef(0);
    const [scrolled, setScrolled] = useState(false);

    const [apiResponse, setApiResponse] = useState(null);
    const [isLoadingDemo, setIsLoadingDemo] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

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
            setScrolled(currentScrollY > 20);

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsNavVisible(false);
            } else {
                setIsNavVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const runDemo = () => {
        setIsLoadingDemo(true);
        setApiResponse(null);
        setTimeout(() => {
            setApiResponse({
                status: 200,
                data: [
                    { id: "usr_1", name: "Alice", role: "admin" },
                    { id: "usr_2", name: "Bob", role: "developer" }
                ],
                time: "14ms"
            });
            setIsLoadingDemo(false);
        }, 800);
    };

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="landing-page">
            <div className="grid-bg"></div>

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, fontSize: '1.2rem', flex: 1 }}>
                        <img src="/logo_u.png" alt="urBackend Logo" style={{ height: '32px', width: 'auto' }} />
                        <span style={{ letterSpacing: '-0.5px' }}>urBackend</span>
                    </div>

                    <div className="nav-links" style={{ display: window.innerWidth > 768 ? 'flex' : 'none', gap: '32px', alignItems: 'center', fontSize: '0.95rem', color: '#888', fontWeight: 500 }}>
                        <a href="#how-it-works" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>How it Works</a>
                        <a href="#features" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Features</a>
                        <a href="#use-cases" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Use Cases</a>
                        <a href="#faq" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>FAQ</a>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                        {isAuthenticated ? (
                            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ fontWeight: 600 }}>
                                Console
                            </button>
                        ) : (
                            <>
                                <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500, marginRight: '10px', display: window.innerWidth > 768 ? 'block' : 'none' }}>Log in</Link>
                                <Link to="/signup" className="btn btn-primary" style={{ fontWeight: 600, padding: '8px 20px' }}>Start Free</Link>
                            </>
                        )}
                        <button className="mobile-menu-btn" style={{ background: 'none', border: 'none', color: '#fff', display: window.innerWidth <= 768 ? 'block' : 'none' }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="hero-section">
                <div className="hero-glow"></div>

                <div className="hero-pill">
                    <Zap size={14} fill="currentColor" strokeWidth={1} /> Public Alpha v0.1.0
                </div>

                <Motion.h1 
                    className="hero-heading"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    Instant Backend.<br />
                    <span className="text-gradient-primary">Just for Frontend Devs.</span>
                </Motion.h1>

                <Motion.p 
                    className="hero-sub"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    No boilerplate. No servers. Get Database, Auth, and Storage APIs in seconds.
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
                        Documentation
                    </Link>
                </Motion.div>

                <Motion.div 
                    id="demo" 
                    className="demo-wrapper"
                    initial={{ opacity: 0, scale: 0.98, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="demo-header">
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <div className="dot red" style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }}></div>
                            <div className="dot yellow" style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }}></div>
                            <div className="dot green" style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }}></div>
                        </div>
                        <div className="url-bar">
                            <span style={{ color: '#fff' }}>https://api.urbackend.bitbros.in/v1/users</span>
                            <span style={{ fontSize: '0.75rem', color: '#666', border: '1px solid #333', padding: '2px 6px', borderRadius: 4 }}>GET</span>
                        </div>
                    </div>

                    <div className="demo-content">
                        <div className="demo-sidebar">
                            <div className="demo-nav-item active"><Database size={16} /> Users</div>
                            <div className="demo-nav-item"><Box size={16} /> Products</div>
                            <div className="demo-nav-item"><HardDrive size={16} /> Storage</div>
                            <div className="demo-nav-item"><Shield size={16} /> Auth</div>
                        </div>
                        <div className="demo-main">
                            <button className="run-btn" onClick={runDemo}>
                                <Play size={14} fill="currentColor" /> {isLoadingDemo ? 'Running...' : 'Send Request'}
                            </button>

                            {isLoadingDemo ? (
                                <div style={{ color: '#666', marginTop: '2rem' }}>Processing request...</div>
                            ) : apiResponse ? (
                                <>
                                    <div style={{ color: '#666', marginBottom: '10px' }}>// Status: <span style={{ color: '#27C93F' }}>200 OK</span> • Time: {apiResponse.time}</div>
                                    <pre style={{ color: '#e5e5e5', lineHeight: 1.5, fontSize: '0.9rem', overflowX: 'auto' }}>
                                        {JSON.stringify(apiResponse.data, null, 2)}
                                    </pre>
                                </>
                            ) : (
                                <div style={{ color: '#444', marginTop: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    <Terminal size={48} color="#333" />
                                    <span>Hit "Send Request" to fetch live data.</span>
                                </div>
                            )}
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
                <div className="section-glow" style={{ bottom: '-10%', left: '-10%', background: 'radial-gradient(circle, rgba(62,207,142,0.06) 0%, transparent 70%)' }}></div>
                <div style={{ textAlign: 'center', marginBottom: '5rem', position: 'relative', zIndex: 1 }}>
                    <h2 className="section-title">Complete Backend Suite</h2>
                    <p className="section-desc">Enterprise-grade tools packaged for individual developers.</p>
                </div>

                <div className="bento-grid">
                    <div className="bento-item bento-span-8">
                        <div>
                            <div className="bento-icon" style={{ background: 'rgba(62, 207, 142, 0.1)', color: '#3ECF8E', boxShadow: '0 0 20px rgba(62, 207, 142, 0.2)' }}>
                                <Database strokeWidth={1.5} />
                            </div>
                            <h3 className="bento-title">Managed NoSQL Database</h3>
                            <p className="bento-desc">
                                High-performance document storage powered by MongoDB.
                                Scale from 10 to 10M records without managing servers.
                            </p>
                            <ul style={{ marginTop: '1rem', color: '#666', listStyle: 'none', padding: 0, display: 'grid', gap: '8px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#3ECF8E" /> Strict Type Validation</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#3ECF8E" /> Auto-generated API Endpoints</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#3ECF8E" /> Real-time Indexing</li>
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
                                <div style={{ padding: '12px', background: 'rgba(62, 207, 142, 0.1)', borderRadius: '12px', color: '#3ECF8E', boxShadow: '0 0 20px rgba(62, 207, 142, 0.2)' }}>
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
                            <Layers strokeWidth={1.5} size={32} color="#3ECF8E" style={{ marginBottom: '1.5rem' }} />
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
                            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(62, 207, 142, 0.1)', color: '#3ECF8E', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>ACTIVE</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Developer Beta</h3>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>$0<span style={{ fontSize: '1rem', color: '#666', fontWeight: 400 }}>/mo</span></div>
                            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.95rem' }}>Perfect for side projects, MVPs, and learning.</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'grid', gap: '12px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#3ECF8E" /> Unlimited Projects</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#3ECF8E" /> 500MB Storage</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#3ECF8E" /> Community Support</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><CheckCircle size={16} color="#3ECF8E" /> BYO Infrastructure</li>
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

            <div className="cta-section" style={{ padding: '8rem 0', background: 'radial-gradient(circle at 50% 50%, rgba(62, 207, 142, 0.05) 0%, transparent 70%)', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>Ready to ship?</h2>
                    <p style={{ fontSize: '1.25rem', color: '#a1a1aa', marginBottom: '3rem' }}>Join hundreds of developers building the future without the backend headaches.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/signup" className="btn-hero-primary" style={{ padding: '1rem 3rem' }}>Create Your Project</Link>
                        <Link to="/login" className="btn-hero-secondary" style={{ padding: '1rem 3rem' }}>Back to Console</Link>
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
                            { q: "Is it really free?", a: "Yes, our Public Beta is free for developers. Create unlimited projects while we refine the platform." },
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