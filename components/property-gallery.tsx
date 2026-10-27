"use client";
import { useState } from "react";
export function PropertyGallery({
  images,
  address,
  illustration,
}: {
  images: string[];
  address: string;
  illustration: string;
}) {
  const [index, setIndex] = useState(0);
  const urls = images.length
    ? images
    : ["/illustrations/" + illustration + ".svg"];
  const move = (delta: number) =>
    setIndex((i) => (i + delta + urls.length) % urls.length);
  return (
    <div
      className="property-gallery"
      role="region"
      aria-label="Property image gallery"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          move(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      <img
        className="gallery-main"
        src={urls[index]}
        alt={
          images.length
            ? `${address}, image ${index + 1}`
            : "Conceptual illustration; not a property photograph"
        }
      />
      {urls.length > 1 && (
        <>
          <div className="toolbar">
            <button
              className="btn ghost"
              onClick={() => move(-1)}
              aria-label="Previous image"
            >
              ←
            </button>
            <span aria-live="polite">
              Image {index + 1} of {urls.length}
            </span>
            <button
              className="btn ghost"
              onClick={() => move(1)}
              aria-label="Next image"
            >
              →
            </button>
          </div>
          <div className="gallery-thumbnails">
            {urls.map((url, i) => (
              <button
                key={url}
                aria-label={"View image " + (i + 1)}
                aria-pressed={index === i}
                onClick={() => setIndex(i)}
              >
                <img src={url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
