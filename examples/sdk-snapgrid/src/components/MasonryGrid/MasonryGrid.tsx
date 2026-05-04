type MasonryGridProps = {
  images?: string[];
};

export function MasonryGrid({ images = [] }: MasonryGridProps) {
  return (
    <section id="sg-gallery" style={{ padding: "30px" }}>
      <h2>Uploaded Images</h2>

      {images.length === 0 ? (
        <p>No images uploaded yet.</p>
      ) : (
        <div style={{ columns: 3, gap: "16px" }}>
          {images.map((url, index) => (
            <img
  key={index}
  src={url}
  alt="Uploaded"
  onError={(e) => {
    e.currentTarget.src =
      "https://via.placeholder.com/300x200?text=Image+Not+Loaded";
  }}
  style={{
    width: "100%",
    marginBottom: "16px",
    borderRadius: "12px",
  }}
/>
          ))}
        </div>
      )}
    </section>
  );
}