import React from 'react';
import styles from './Hero.module.css';

interface HeroProps {
  onScrollToGallery: () => void;
  onUploadClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToGallery, onUploadClick }) => {
  const handleScroll = () => {
    if (onScrollToGallery) {
      onScrollToGallery();
    } else {
      document.getElementById('sg-gallery')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.hero}>

      {/* ── ambient decorative layers (no layout impact) ── */}
      <div className={styles.ambientTop}  aria-hidden />
      <div className={styles.ambientLeft} aria-hidden />
      <div className={styles.grain}       aria-hidden />

      {/* ── hero content ── */}
      <div className={styles.content}>

        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          AI · Photography · Design · Illustration
        </p>

        <h1 className={styles.headline}>
          Showcase Your<br />
          <em className={styles.headlineGold}>Finest Creations.</em>
        </h1>

        <p className={styles.subline}>
          A curated grid for creators who refuse to be ordinary.
          Upload, explore, and get discovered.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={onUploadClick}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.3"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Start Uploading
          </button>

          <button className={styles.btnGhost} onClick={handleScroll}>
            Browse Gallery
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <div className={styles.statsRow}>
          {([
            { n: '12K+', l: 'Artworks' },
            { n: '4.2K', l: 'Creators' },
            { n: '98%',  l: '5-star rated' },
          ] as const).map((s, i) => (
            <React.Fragment key={s.l}>
              {i > 0 && <div className={styles.statsDivider} aria-hidden />}
              <div className={styles.stat}>
                <span className={styles.statN}>{s.n}</span>
                <span className={styles.statL}>{s.l}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── scroll nudge ── */}
      <button className={styles.scrollHint} onClick={handleScroll} aria-label="Scroll to gallery">
        <div className={styles.scrollLine} />
        <span>scroll</span>
      </button>
    </section>
  );
};