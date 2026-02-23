"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from "lucide-react";
import type { CustomerCareQAItem } from "@/hooks/use-masterfile";

interface CustomerCareQAProps {
  items: CustomerCareQAItem[];
  onSave: (items: CustomerCareQAItem[]) => void;
}

export function CustomerCareQA({ items, onSave }: CustomerCareQAProps) {
  const [localItems, setLocalItems] = useState<CustomerCareQAItem[]>(items);
  const [dirty, setDirty] = useState(false);

  function updateItem(index: number, field: keyof CustomerCareQAItem, value: string) {
    const next = [...localItems];
    next[index] = { ...next[index], [field]: value };
    setLocalItems(next);
    setDirty(true);
  }

  function addItem() {
    setLocalItems([...localItems, { question: "", answer: "" }]);
    setDirty(true);
  }

  function removeItem(index: number) {
    const next = localItems.filter((_, i) => i !== index);
    setLocalItems(next);
    setDirty(true);
  }

  function handleSave() {
    const filtered = localItems.filter((item) => item.question.trim() !== "");
    onSave(filtered);
    setLocalItems(filtered);
    setDirty(false);
  }

  return (
    <div className="space-y-3">
      {localItems.map((item, idx) => (
        <div key={idx} className="space-y-2 rounded-md border p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <Input
                value={item.question}
                onChange={(e) => updateItem(idx, "question", e.target.value)}
                placeholder="Domanda"
                className="text-sm font-medium"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive shrink-0"
              onClick={() => removeItem(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Textarea
            value={item.answer ?? ""}
            onChange={(e) => updateItem(idx, "answer", e.target.value)}
            placeholder="Risposta..."
            className="text-sm"
            rows={2}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Aggiungi domanda
        </Button>
        {dirty && (
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Salva Q&A
          </Button>
        )}
      </div>
    </div>
  );
}
