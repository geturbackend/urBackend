import { sdk } from "../../services/sdk";
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

interface NavbarProps {
  onUploadClick: () => void;
  onSearch: (q: string) => void;
  searchValue: string;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ onUploadClick, onSearch, searchValue }) => {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();

 useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 20);
  window.addEventListener('scroll', handler, { passive: true });

  const checkUser = async () => {
    try {
      const currentUser = await sdk.auth.getUser();
      setUser(currentUser);
    } catch {
      console.log("No user logged in yet");
    }
  };

  checkUser();

  return () => window.removeEventListener('scroll', handler);
}, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>✦</span>
          <span className={styles.logoText}>SnapGrid</span>
        </Link>

        {/* Search */}
        <div className={`${styles.searchWrap} ${mobileSearchOpen ? styles.searchOpen : ''}`}>
          <span className={styles.searchIcon}><SearchIcon /></span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search creations…"
            value={searchValue}
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        {/* Nav links */}
        <div className={styles.navLinks}>
          <Link
            to="/"
            className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
          >Explore</Link>
          <Link
            to="/my-gallery"
            className={`${styles.navLink} ${location.pathname === '/my-gallery' ? styles.active : ''}`}
          >My Gallery</Link>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.mobileSearch}
            onClick={() => setMobileSearchOpen(v => !v)}
            aria-label="Toggle search"
          >
            <SearchIcon />
            </button>
        {!user ? (
  <button
    className={styles.loginBtn}
  onClick={() => {
  alert("Login is not available in this SDK yet");
}}
  >
    Login
  </button>
) : (
  <div
  className={styles.avatar}
  onClick={async () => {
    await sdk.auth.logout();
    setUser(null);
  }}
>
  <img
    src={user?.avatar || "https://i.pravatar.cc/36"}
    alt="User avatar"
  />
</div>
)}
        </div>
      </div>
    </nav>
  );
};