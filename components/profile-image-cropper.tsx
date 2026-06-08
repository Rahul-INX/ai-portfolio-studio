"use client";

import { Check, ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { resolvePortfolioMedia } from "@/lib/media";

const PROFILE_ASPECT = 4 / 5;

async function croppedImageFile(source: string, crop: Area) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = source;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is not available.");

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not create the cropped image."))),
      "image/jpeg",
      0.9
    );
  });

  return new File([blob], "profile-portrait.jpg", { type: "image/jpeg" });
}

export function ProfileImageCropper({
  value,
  onChange,
  onMessage
}: {
  value: string;
  onChange: (value: string) => void | Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [source, setSource] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area>();
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    return () => {
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    };
  }, [source]);

  async function applyCrop() {
    if (!source || !pixels) return;
    setApplying(true);
    onMessage("Cropping and uploading portrait...");
    try {
      const file = await croppedImageFile(source, pixels);
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/media", { method: "POST", body: form });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Image upload failed.");
      onMessage("Upload complete. Publishing portrait...");
      await onChange(payload.url);
      setSource("");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      onMessage("Portrait published successfully.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Image crop failed.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border hairline bg-[var(--panel-strong)] md:col-span-2">
      {source ? (
        <div className="grid min-w-0 gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)] lg:items-center lg:gap-6 lg:p-5">
          <div className="flex min-w-0 justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground),transparent_96%)] p-2 sm:p-3">
            <div className="relative aspect-[4/5] h-auto max-h-[52dvh] w-[min(100%,27.2rem)] max-w-[calc(52dvh*0.8)] overflow-hidden rounded-md bg-ink-950 shadow-[0_16px_45px_rgba(0,0,0,0.24)]">
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={PROFILE_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setPixels(areaPixels)}
                objectFit="cover"
                showGrid
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col rounded-lg border hairline bg-[var(--panel)] p-4 sm:p-5">
            <div>
              <p className="text-base font-semibold">Frame profile portrait</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
                Drag the image to position the face. The fixed 4:5 frame matches the public profile card.
              </p>
              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-medium text-[var(--muted)]">
                  Zoom <span>{zoom.toFixed(1)}x</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-3 w-full accent-cobalt-500"
                />
              </label>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]">
              <button
                type="button"
                onClick={applyCrop}
                disabled={applying}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink-900 px-4 text-center text-sm font-medium text-white transition hover:bg-cobalt-600 disabled:cursor-wait disabled:opacity-60 dark:bg-ink-50 dark:text-ink-950"
              >
                <Check aria-hidden className="h-4 w-4" />
                {applying ? "Uploading and publishing..." : "Apply and publish"}
              </button>
              <button
                type="button"
                onClick={() => setSource("")}
                disabled={applying}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border hairline px-4 text-sm font-medium transition hover:border-cobalt-500 disabled:opacity-60"
              >
                <X aria-hidden className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md border hairline bg-[var(--panel)]">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolvePortfolioMedia(value)} alt="Profile portrait preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-[var(--muted)]">
                <ImageIcon aria-hidden className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Profile image</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Select an image, position it inside the portrait frame, then apply the crop.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-ink-900 px-4 text-sm font-medium text-white transition hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950">
                <Upload aria-hidden className="h-4 w-4" />
                Choose and crop
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setSource(URL.createObjectURL(file));
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    event.target.value = "";
                  }}
                />
              </label>
              {value ? (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="h-10 rounded-md border hairline px-4 text-sm font-medium transition hover:border-cobalt-500"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
