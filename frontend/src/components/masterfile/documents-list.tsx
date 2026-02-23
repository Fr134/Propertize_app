"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Trash2, ExternalLink, Plus, Save } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import type { DocumentItem } from "@/hooks/use-masterfile";

interface DocumentsListProps {
  items: DocumentItem[];
  onSave: (items: DocumentItem[]) => void;
}

export function DocumentsList({ items, onSave }: DocumentsListProps) {
  const [localItems, setLocalItems] = useState<DocumentItem[]>(items);
  const [dirty, setDirty] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const { startUpload, isUploading } = useUploadThing("masterfileDoc");

  async function handleUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingIdx(idx);
    try {
      const res = await startUpload(Array.from(files));
      if (res?.[0]?.ufsUrl) {
        const next = [...localItems];
        next[idx] = {
          ...next[idx],
          file_url: res[0].ufsUrl,
          uploaded_at: new Date().toISOString(),
        };
        setLocalItems(next);
        setDirty(true);
      }
    } catch {
      // error handled upstream
    }
    setUploadingIdx(null);
    e.target.value = "";
  }

  function removeFile(idx: number) {
    const next = [...localItems];
    next[idx] = { ...next[idx], file_url: "", uploaded_at: "" };
    setLocalItems(next);
    setDirty(true);
  }

  function addItem() {
    setLocalItems([...localItems, { label: "", file_url: "", uploaded_at: "" }]);
    setDirty(true);
  }

  function updateLabel(idx: number, label: string) {
    const next = [...localItems];
    next[idx] = { ...next[idx], label };
    setLocalItems(next);
    setDirty(true);
  }

  function removeItem(idx: number) {
    setLocalItems(localItems.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function handleSave() {
    const filtered = localItems.filter((d) => d.label.trim() !== "");
    onSave(filtered);
    setLocalItems(filtered);
    setDirty(false);
  }

  return (
    <div className="space-y-3">
      {localItems.map((doc, idx) => (
        <div key={idx} className="flex items-center gap-3 rounded-md border p-3">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 space-y-1">
            <Input
              value={doc.label}
              onChange={(e) => updateLabel(idx, e.target.value)}
              placeholder="Etichetta documento"
              className="text-sm h-8"
            />
            {doc.file_url ? (
              <div className="flex items-center gap-2">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Apri file
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive"
                  onClick={() => removeFile(idx)}
                >
                  Rimuovi
                </Button>
              </div>
            ) : (
              <Label className="cursor-pointer">
                <span className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {isUploading && uploadingIdx === idx ? "Caricamento..." : "Carica file"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleUpload(idx, e)}
                  disabled={isUploading}
                />
              </Label>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive shrink-0"
            onClick={() => removeItem(idx)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Aggiungi documento
        </Button>
        {dirty && (
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Salva documenti
          </Button>
        )}
      </div>
    </div>
  );
}
