import { Link } from 'react-router-dom';
import { Github, ArrowRight, Database } from 'lucide-react';
import { ADMIN_EMAIL } from '../../config';

/**
 * Renders the site footer with branding, product/connect navigation, a newsletter input, social links, legal text, and a large decorative background wordmark.
 *
 * The component is presentational and includes responsive styles for desktop and mobile layouts.
 * @returns {JSX.Element} The footer element containing the footer layout and embedded styles.
 */
export default function Footer() {
    return (
        <footer className="modern-footer">
            <div className="footer-content container">

                {/* Top Section: Centered Layout */}
                <div className="footer-top">

                    {/* Brand / Newsletter Column */}
                    <div className="footer-brand-col">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <img src="/urBACKEND_NAV_LOGO (2).png" alt="urBackend Logo" style={{ height: '80px', width: 'auto' }} />
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '300px' }}>
                            The instant Backend-as-a-Service for frontend developers. Ship faster.
                        </p>

                        <div className="footer-input-wrapper">
                            <input type="email" placeholder="Stay up to date" />
                            <button><ArrowRight size={16} /></button>
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
                        <span>&copy; 2025 urBackend Inc.</span>
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
                    padding-top: 6rem;
                    color: #fff;
                    overflow: hidden;
                    position: relative;
                }

                /* --- KEY FIXES HERE --- */
                .footer-top {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center; /* Center alignment */
                    gap: 4rem; /* Reduced from 8rem to prevent wrapping */
                    margin-bottom: 5rem;
                    text-align: left; /* Keep text left aligned inside blocks */
                }

                .footer-brand-col {
                    flex: 0 1 auto; /* Don't stretch */
                    min-width: 280px;
                }

                .footer-nav-grid {
                    display: flex;
                    gap: 3rem; /* Reduced from 5rem */
                    flex-wrap: wrap;
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
                    max-width: 320px;
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
                    padding-bottom: 3rem;
                    border-bottom: 1px solid #222;
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
                        flex-direction: column; 
                        align-items: center; 
                        text-align: center;
                        gap: 3rem;
                    }
                    .footer-brand-col { 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                    }
                    .footer-nav-grid { 
                        gap: 3rem; 
                        justify-content: center; 
                        text-align: center; /* Center links on mobile for better symmetry */
                    }
                    /* If using left align on mobile, ensure consistent width */
                    /* .footer-nav-grid { text-align: left; } */
                    
                    .footer-middle { 
                        flex-direction: column; 
                        gap: 2rem; 
                    }
                }
            `}</style>
        </footer>
    );
}