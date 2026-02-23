"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Check, X } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";

interface MasterfilePhotoFieldProps {
  label: string;
  photoUrl: string | null | undefined;
  fieldName: string;
  onSave: (fieldName: string, value: string | null) => Promise<void>;
}

export function MasterfilePhotoField({
  label,
  photoUrl,
  fieldName,
  onSave,
}: MasterfilePhotoFieldProps) {
  const [saved, setSaved] = useState(false);
  const { startUpload, isUploading } = useUploadThing("masterfilePhoto");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      const res = await startUpload(Array.from(files));
      if (res?.[0]?.ufsUrl) {
        await onSave(fieldName, res[0].ufsUrl);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // error handled upstream
    }
    e.target.value = "";
  }

  async function handleRemove() {
    try {
      await onSave(fieldName, null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error handled upstream
    }
  }

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" /> Salvato
          </span>
        )}
      </div>
      {photoUrl ? (
        <div className="relative group w-fit">
          <img
            src={photoUrl}
            alt={label}
            className="h-24 w-auto rounded-md border object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="flex items-center justify-center h-24 w-24 rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors">
            {isUploading ? (
              <span className="text-xs text-muted-foreground">Upload...</span>
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground/50" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
