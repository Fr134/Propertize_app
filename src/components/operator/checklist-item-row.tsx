"use client";

import { useState } from "react";
import { useUpdateChecklistItem, useSaveTaskPhoto, type ChecklistDataItem } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CheckCircle2, Circle, Upload, Loader2 } from "lucide-react";

interface ChecklistItemRowProps {
  taskId: string;
  index: number;
  item: ChecklistDataItem;
  disabled: boolean;
}

export function ChecklistItemRow({ taskId, index, item, disabled }: ChecklistItemRowProps) {
  const updateItem = useUpdateChecklistItem(taskId);
  const savePhoto = useSaveTaskPhoto(taskId);
  const [uploading, setUploading] = useState(false);

  async function toggleCompleted() {
    if (disabled) return;
    await updateItem.mutateAsync({ itemIndex: index, completed: !item.completed });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    setUploading(true);
    try {
      // TODO: replace with Uploadthing React component in production
      const blobUrl = URL.createObjectURL(file);

      await savePhoto.mutateAsync({
        checklistItemIndex: index,
        photoUrl: blobUrl,
      });
    } catch {
      // error handled by mutation
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleCompleted}
          disabled={disabled || updateItem.isPending}
          className="mt-0.5 shrink-0 disabled:opacity-50"
        >
          {item.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{item.area}</p>
            {item.photo_required && (
              <span className="flex items-center gap-1 text-xs text-orange-600">
                <Camera className="h-3 w-3" />
                Foto richiesta
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>

          {/* Photos */}
          {item.photo_urls?.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {item.photo_urls.map((url, pi) => (
                <img
                  key={pi}
                  src={url}
                  alt={`Foto ${item.area}`}
                  className="h-16 w-16 rounded object-cover border"
                />
              ))}
            </div>
          )}

          {/* Upload button */}
          {!disabled && (
            <div className="mt-2">
              <label className="inline-flex cursor-pointer">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="pointer-events-none"
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-3 w-3" />
                  )}
                  {uploading ? "Upload..." : "Carica foto"}
                </Button>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
