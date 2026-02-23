"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldType = "text" | "textarea" | "boolean" | "number" | "date" | "url" | "password";

interface MasterfileFieldProps {
  label: string;
  value: string | number | boolean | null | undefined;
  fieldName: string;
  type?: FieldType;
  onSave: (fieldName: string, value: string | number | boolean | null) => Promise<void>;
  masked?: boolean;
  placeholder?: string;
}

export function MasterfileField({
  label,
  value,
  fieldName,
  type = "text",
  onSave,
  masked = false,
  placeholder,
}: MasterfileFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [showMasked, setShowMasked] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    if (type === "boolean") return;
    setLocalValue(value != null ? String(value) : "");
    setEditing(true);
  }, [type, value]);

  async function handleSave() {
    setEditing(false);
    let saveValue: string | number | null = localValue || null;
    if (type === "number" && localValue) {
      saveValue = parseFloat(localValue);
      if (isNaN(saveValue)) saveValue = null;
    }
    try {
      await onSave(fieldName, saveValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error handled upstream
    }
  }

  async function handleBooleanChange(checked: boolean) {
    try {
      await onSave(fieldName, checked);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error handled upstream
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && type !== "textarea") {
      handleSave();
    }
    if (e.key === "Escape") {
      setEditing(false);
    }
  }

  if (type === "boolean") {
    return (
      <div className="flex items-center justify-between py-2">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <Switch
            checked={!!value}
            onCheckedChange={handleBooleanChange}
          />
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" /> Salvato
            </span>
          )}
        </div>
      </div>
    );
  }

  const displayValue = value != null && value !== "" ? String(value) : null;
  const isMaskedDisplay = masked && !showMasked && displayValue;

  return (
    <div className="space-y-1 py-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" /> Salvato
          </span>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2">
          {type === "textarea" ? (
            <Textarea
              ref={inputRef as React.Ref<HTMLTextAreaElement>}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              rows={3}
              className="text-sm"
              placeholder={placeholder}
            />
          ) : (
            <Input
              ref={inputRef as React.Ref<HTMLInputElement>}
              type={type === "number" ? "number" : type === "date" ? "date" : "text"}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-sm"
              step={type === "number" ? "any" : undefined}
              placeholder={placeholder}
            />
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 min-h-[36px] px-3 py-2 rounded-md border border-transparent hover:border-input cursor-pointer transition-colors text-sm",
            !displayValue && "text-muted-foreground"
          )}
          onClick={startEdit}
        >
          <span className="flex-1">
            {isMaskedDisplay ? "••••••••" : displayValue ?? (placeholder || "—")}
          </span>
          {masked && displayValue && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowMasked(!showMasked);
              }}
            >
              {showMasked ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
          <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </div>
      )}
    </div>
  );
}
