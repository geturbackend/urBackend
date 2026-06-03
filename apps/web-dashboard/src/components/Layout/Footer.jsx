import { Link } from 'react-router-dom';
import { Github, ArrowRight, Database } from 'lucide-react';
import { ADMIN_EMAIL } from '../../config';

export default function Footer() {
    return (
        <footer className="modern-footer">
            <div className="footer-content container">

                {/* Top Section: Centered Layout */}
                <div className="footer-top">

                    {/* Brand / Newsletter Column */}
                    <div className="footer-brand-col">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <img src="https://cdn.jsdelivr.net/gh/yash-pouranik/urBackend/apps/web-dashboard/public/logo.png" alt="urBackend Logo" style={{ height: '80px', width: 'auto' }} />
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '300px' }}>
                            The instant Backend-as-a-Service for frontend developers. Ship faster.
                        </p>

                        <h3 style={{fontSize: '18px', fontWeight: 'bold'}}>
                            Subscribe To Our Newsletter :
                        </h3>
                        <p style={{ color: '#C0C0C0', marginBottom: '0.5rem', maxWidth: '350px', fontSize: '15px' }}>
                           Be the first to know what’s shipping next.
                        </p>
                        <div className="footer-input-wrapper">
                            <input 
                                type="email" 
                                placeholder="Enter your E-mail" 
                                aria-label="Email address for newsletter subscription"
                            />
                            <button type="button" aria-label="Subscribe to newsletter">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="footer-nav-grid">

                        <div className="footer-col">
                            <h4>Product</h4>
                            <a href="/#features">Features</a>
                            <a href="/#use-cases">Use Cases</a>
                            <a href="/#how-it-works">How it Works</a>
                            <Link to="/docs">Documentation</Link>
                        </div>

                        <div className="footer-col">
                            <h4>Connect</h4>
                            <a href="https://discord.gg/CXJjvJkNWn" target="_blank" rel="noreferrer">Discord</a>
                            <a href="https://github.com/yash-pouranik/urBackend" target="_blank" rel="noreferrer">Github</a>
                            <a href={`mailto:${ADMIN_EMAIL}`}>Email</a>
                        </div>
                    </div>
                </div>

                <div className="footer-middle">
                    <div className="social-links">
                        <a href="https://github.com/yash-pouranik/urBackend" target="_blank" className="social-icon"><Github size={20} /></a>
                    </div>
                    <div className="legal-links">
                        <span>&copy; 2026 urBackend Inc.</span>
                    </div>
                </div>

                {/* Bottom: Massive Typography */}
                <div className="footer-big-text">
                    URBACKEND
                </div>
            </div>

            {/* --- UPDATED STYLES (Center Aligned) --- */}
            <style>{`
                .modern-footer {
                    background-color: #050505;
                    border-top: 1px solid #222;
                    padding-top: 4rem;
                    color: #fff;
                    overflow: hidden;
                    position: relative;
                }

                /* --- KEY FIXES HERE --- */
                .footer-top {
                    width: 80%;
                    display: grid;
                    grid-template-columns: minmax(280px, 360px) 1fr;
                    flex-wrap: wrap;
                    justify-self: center;
                    gap: 4rem; /* Reduced from 8rem to prevent wrapping */
                    margin-bottom: 5rem;
                    text-align: left; /* Keep text left aligned inside blocks */    
                }

                .footer-brand-col {
                    flex: 0 1 auto; /* Don't stretch */
                    min-width: 280px;
                }

                .footer-nav-grid {
                    padding-top: 1rem;
                    padding-left: clamp(0rem, 4vw, 3rem);
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    gap: clamp(1.5rem, 3vw, 3rem);
                    flex-wrap: wrap;
                    justify-content: space-evenly;
                }
                /* --------------------- */

                /* Input Styles */
                .footer-input-wrapper {
                    display: flex;
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 50px;
                    padding: 6px;
                    width: 100%; /* Fill column width */
                    max-width: 360px;
                    transition: border-color 0.2s;
                }
                .footer-input-wrapper:focus-within {
                    border-color: var(--color-primary);
                }
                .footer-input-wrapper input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    padding: 0 16px;
                    flex: 1;
                    outline: none;
                    font-size: 0.9rem;
                }
                .footer-input-wrapper button {
                    background: #333;
                    border: none;
                    color: #fff;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .footer-input-wrapper button:hover {
                    background: var(--color-primary);
                    color: #000;
                }

                /* Links Styles */
                .footer-col h4 {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: #666;
                    margin-bottom: 1.2rem;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                .footer-col {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .footer-col a {
                    color: #ccc;
                    text-decoration: none;
                    font-size: 0.95rem;
                    transition: color 0.2s;
                }
                .footer-col a:hover {
                    color: #fff;
                }

                /* Middle Section */
                .footer-middle {
                    display: flex;
                    justify-content: center; /* Centered */
                    gap: 4rem; /* Gap between Socials and Legal */
                    align-items: center;
                    padding-bottom: 1rem;
                    padding-top: 1rem;
                    border-bottom: 1px solid #222;
                    border-top: 1px solid #222;

                    flex-wrap: wrap;
                }
                .social-links { display: flex; gap: 1.5rem; }
                .social-icon { color: #666; transition: 0.2s; }
                .social-icon:hover { color: #fff; }
                
                .legal-links {
                    display: flex;
                    gap: 2rem;
                    font-size: 0.85rem;
                    color: #666;
                }
                .legal-links a { color: #666; text-decoration: none; }
                .legal-links a:hover { color: #fff; }

                /* BIG TEXT */
                .footer-big-text {
                    font-size: clamp(3rem, 15vw, 12rem); /* Slightly reduced max size */
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.03); /* Subtle opacity */
                    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%); /* Optional gradient effect */
                    -webkit-background-clip: text;
                    background-clip: text;
                    line-height: 0.8;
                    text-align: center;
                    margin-top: 1rem;
                    margin-bottom: -2%;
                    letter-spacing: -0.04em;
                    pointer-events: none;
                    user-select: none;
                }

                /* Mobile Tweaks */
                @media (max-width: 900px) {
                    .footer-top { 
                        width: 100%;
                        display: flex;
                        flex-direction: column; 
                        align-items: center;
                        text-align: left;
                        gap: 3rem;
                        padding: 0 1.5rem;
                    }
                    .footer-brand-col { 
                        display: flex; 
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                    }
                    .footer-nav-grid { 
                        width: 100%;
                        gap: 0; 
                        padding-left: 0;
                        justify-content: flex-start;
                        text-align: left;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                    }
                    .footer-col {
                        align-items: center;
                    }
                    
                    .footer-middle { 
                        flex-direction: row; 
                        gap: 2rem; 
                        align-items: center;
                    }
                }
            `}</style>
        </footer>
    );
}
