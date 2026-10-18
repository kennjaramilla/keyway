"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

/** Validate a chosen photo; returns an error message or null. */
export function photoError(file: File) {
  if (!ACCEPTED.includes(file.type)) return "Choose a JPG, PNG or WebP image.";
  if (file.size > MAX_BYTES) return "Choose an image under 10 MB.";
  return null;
}

/** Optional photo with a local preview. It is never uploaded, so it isn't part of the form values. */
export function PhotoField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  const clear = () => {
    setPreview(null);
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
              const url = URL.createObjectURL(file);
              // Only ever render a local blob: preview, never a URL derived from user text.
              if (!url.startsWith("blob:")) return clear();
              setPreview({ url, name: file.name });
            }}
          />
          {preview && (
            <div className="flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img
                src={preview.url}
                alt={`Preview of ${preview.name}`}
                className="h-28 w-28 rounded-md border border-border object-cover"
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
