"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const PREVIEW_PX = 112;

/** Validate a chosen photo; returns an error message or null. */
export function photoError(file: File) {
  if (!ACCEPTED.includes(file.type)) return "Choose a JPG, PNG or WebP image.";
  if (file.size > MAX_BYTES) return "Choose an image under 10 MB.";
  return null;
}

/**
 * Optional photo with a local preview. It is never uploaded, so it isn't part
 * of the form values. The preview is drawn on a canvas, so no URL is built from the file.
 */
export function PhotoField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!photo) return;
    let cancelled = false;
    createImageBitmap(photo)
      .then((bitmap) => {
        const context = canvasRef.current?.getContext("2d");
        if (cancelled || !context) return bitmap.close();
        // Cover-crop into the square preview.
        const scale = Math.max(PREVIEW_PX / bitmap.width, PREVIEW_PX / bitmap.height);
        const width = bitmap.width * scale;
        const height = bitmap.height * scale;
        context.drawImage(
          bitmap,
          (PREVIEW_PX - width) / 2,
          (PREVIEW_PX - height) / 2,
          width,
          height,
        );
        bitmap.close();
      })
      .catch(() => !cancelled && setError("We couldn't read that image. Try another one."));
    return () => {
      cancelled = true;
    };
  }, [photo]);

  const clear = () => {
    setPhoto(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <FormField
      label="Photo (optional)"
      hint="The photo stays on your device for this demo. It isn't uploaded."
      error={error}
    >
      {(control) => (
        <div className="grid gap-3">
          <Input
            {...control}
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="py-2"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return clear();
              const problem = photoError(file);
              setError(problem ?? undefined);
              if (problem) return clear();
              setPhoto(file);
            }}
          />
          {photo && (
            <div className="flex flex-wrap items-center gap-4">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Preview of ${photo.name}`}
                width={PREVIEW_PX}
                height={PREVIEW_PX}
                className="size-28 rounded-md border border-border bg-surface-muted"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  clear();
                  inputRef.current?.focus();
                }}
              >
                Remove photo
              </Button>
            </div>
          )}
        </div>
      )}
    </FormField>
  );
}
