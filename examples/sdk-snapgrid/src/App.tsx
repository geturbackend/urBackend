import { sdk } from "./services/sdk";
import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";

import { Navbar } from "./components/Navbar/Navbar";
import { Hero } from "./components/Hero/Hero";
import { MasonryGrid } from "./components/MasonryGrid/MasonryGrid";

function App() {
  const [search, setSearch] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      const res = await fetch("http://localhost:1235/api/images");
      const data = await res.json();

      const urls = data.images.map((img: { url: string }) => img.url);
      setImages(urls);
    };

    fetchImages();
  }, []);

  const handleScrollToGallery = () => {
    const section = document.getElementById("sg-gallery");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const result = await sdk.storage.upload(file);
       

        const imageUrl = new URL(result.url).toString();

        await fetch("http://localhost:1235/api/images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: imageUrl }),
        });

        setImages((prev) => [...prev, imageUrl]);

        alert("Upload successful!");
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Upload failed");
      }
    };

    input.click();
  };

  return (
    <BrowserRouter>
      <Navbar
        searchValue={search}
        onSearch={setSearch}
        onUploadClick={handleUploadClick}
      />

      <Hero
        onScrollToGallery={handleScrollToGallery}
        onUploadClick={handleUploadClick}
      />

      <MasonryGrid images={images} />
    </BrowserRouter>
  );
}

export default App;