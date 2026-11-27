import { useEffect, useState } from "react";
import {
  getWeighmentImages,
  getWeighmentImage
} from "../api/UserWeighmentApi";
import "../style/WeighmentImageGallery.css";

const groups = [
  { title: "Gross Weight Images", prefix: "GrossCamera" },
  { title: "Tare Weight Images", prefix: "TareCamera" },
  { title: "First Weight Images", prefix: "FirstWeightImage" },
  { title: "Second Weight Images", prefix: "SecondWeightImage" }
];

function imageLabel(type) {
  const number = type.match(/\d+$/)?.[0];
  return number ? `Camera ${number}` : type;
}

function CameraImage({ siteId, transactionId, image, onPreview, isAdmin }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;

    setUrl("");
    setError("");

    getWeighmentImage(
      siteId,
      transactionId,
      image.imageType,
      controller.signal,
      isAdmin
    )
      .then((blob) => {
        if (controller.signal.aborted) return;

        if (!["image/jpeg", "image/png"].includes(blob.type)) {
          throw new Error("Invalid image format.");
        }

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message || "Image unavailable.");
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [siteId, transactionId, image.imageType, isAdmin]);

  return (
    <div className="wig-image-card">
      <strong>{imageLabel(image.imageType)}</strong>

      {error ? (
        <p className="wig-error">{error}</p>
      ) : url ? (
        <button
          type="button"
          className="wig-thumbnail"
          onClick={() => onPreview({
            url,
            title: image.imageType
          })}
        >
          <img
            src={url}
            alt={image.imageType}
            onError={() => setError("Unable to display image.")}
          />
        </button>
      ) : (
        <p role="status">Loading image...</p>
      )}
    </div>
  );
}

export default function WeighmentImageGallery({
  siteId,
  transactionId,
  isAdmin = false
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setImages([]);
    setError("");
    setPreview(null);
    setLoading(true);

    getWeighmentImages(
      siteId,
      transactionId,
      controller.signal,
      isAdmin
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setImages(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load CCTV images.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [siteId, transactionId, reload, isAdmin]);

  useEffect(() => {
    if (!preview) return;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPreview(null);
    };

    window.addEventListener("keydown", closeOnEscape);

    return () =>
      window.removeEventListener("keydown", closeOnEscape);
  }, [preview]);

  return (
    <section className="wig-root">
      <div className="wig-header">
        <h3>CCTV Images</h3>
        <button
          type="button"
          disabled={loading}
          onClick={() => setReload((value) => value + 1)}
        >
          Refresh Images
        </button>
      </div>

      {loading && <p role="status">Loading CCTV images...</p>}

      {error && <p className="wig-error" role="alert">{error}</p>}

      {!loading && !error && images.length === 0 && (
        <p className="wig-empty">
          No CCTV images synchronized for this ticket yet.
        </p>
      )}

      {groups.map((group) => {
        const items = images
          .filter((image) =>
            image.imageType.startsWith(group.prefix)
          )
          .sort((a, b) =>
            a.imageType.localeCompare(
              b.imageType, undefined, { numeric: true }
            )
          );

        if (!items.length) return null;

        return (
          <div className="wig-group" key={group.prefix}>
            <h4>{group.title} ({items.length})</h4>

            <div className="wig-grid">
              {items.map((image) => (
                <CameraImage
                  key={`${siteId}-${transactionId}-${image.imageType}`}
                  siteId={siteId}
                  transactionId={transactionId}
                  image={image}
                  onPreview={setPreview}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        );
      })}

      {preview && (
        <div
          className="wig-preview"
          onClick={() => setPreview(null)}
        >
          <div
            className="wig-preview-content"
            role="dialog"
            aria-modal="true"
            aria-label={preview.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="wig-preview-header">
              <strong>{preview.title}</strong>
              <button
                type="button"
                autoFocus
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
            <img src={preview.url} alt={preview.title} />
          </div>
        </div>
      )}
    </section>
  );
}
