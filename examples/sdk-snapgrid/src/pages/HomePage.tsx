export function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot"></span>
          SnapGrid
        </div>

        <h1 className="hero-title">
          Showcase your <em>AI creations</em>
        </h1>

        <p className="hero-subtitle">
          Discover, upload, and share beautiful AI-generated art with the world.
        </p>

        <div className="hero-cta">
          <button className="btn btn-accent">Upload</button>
          <button className="btn btn-outline">Explore</button>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Discover</h2>
            <p className="section-subtitle">
              Latest AI generated artworks
            </p>
          </div>
        </div>

        <div className="masonry-grid">
          {/* Sample cards */}
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="post-card">
              <img
                className="post-card-image"
                src={`https://picsum.photos/300/40${i}`}
                alt={`Gallery image ${i}`}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}