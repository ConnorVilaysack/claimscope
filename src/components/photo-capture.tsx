"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Camera, Check, RotateCcw } from "lucide-react";
import Image from "next/image";

interface PhotoCaptureProps {
  onCapture: (file: File) => Promise<void>;
  capturedUrl?: string;
  instruction: string;
}

export function PhotoCapture({ onCapture, capturedUrl, instruction }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(capturedUrl || null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    setUploading(true);

    try {
      await onCapture(file);
    } finally {
      setUploading(false);
    }
  }

  function handleRetake() {
    setPreview(null);
    inputRef.current?.click();
  }

  if (preview) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
          <img
            src={preview}
            alt="Captured photo"
            className="h-full w-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
              <div className="flex flex-col items-center gap-2 text-white">
                <Spinner size="lg" className="text-white" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            </div>
          )}
          {!uploading && (
            <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-lg">
              <Check className="h-5 w-5" />
            </div>
          )}
        </div>
        {!uploading && (
          <Button variant="outline" size="default" className="w-full" onClick={handleRetake}>
            <RotateCcw className="h-4 w-4" />
            Retake Photo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted active:scale-[0.99]"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Tap to take photo</p>
          <p className="text-xs text-muted-foreground mt-0.5 px-6">
            {instruction}
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
