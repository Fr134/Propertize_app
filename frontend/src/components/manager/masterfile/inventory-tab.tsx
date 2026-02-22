"use client";

import { useState } from "react";
import {
  usePropertyInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
} from "@/hooks/use-masterfile";
import type { InventoryItem } from "@/hooks/use-masterfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import { InventoryItemSheet } from "./inventory-item-sheet";

const conditionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  GOOD: { label: "Buono", variant: "default" },
  DAMAGED: { label: "Danneggiato", variant: "secondary" },
  BROKEN: { label: "Rotto", variant: "destructive" },
  REPLACED: { label: "Sostituito", variant: "outline" },
};

export function InventoryTab({ propertyId }: { propertyId: string }) {
  const { data: groups, isLoading } = usePropertyInventory(propertyId);
  const createMutation = useCreateInventoryItem(propertyId);
  const updateMutation = useUpdateInventoryItem(propertyId);
  const deleteMutation = useDeleteInventoryItem(propertyId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  function openCreate() {
    setEditingItem(null);
    setSheetOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item);
    setSheetOpen(true);
  }

  async function handleSave(data: Record<string, unknown>) {
    if (editingItem) {
      await updateMutation.mutateAsync({ itemId: editingItem.id, data });
    } else {
      await createMutation.mutateAsync(data as never);
    }
    setSheetOpen(false);
    setEditingItem(null);
  }

  async function handleDelete(itemId: string) {
    await deleteMutation.mutateAsync(itemId);
    setConfirmDelete(null);
  }

  const totalItems =
    groups?.reduce((acc, g) => acc + g.items.length, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalItems} oggett{totalItems === 1 ? "o" : "i"} in{" "}
          {groups?.length ?? 0} stanz{(groups?.length ?? 0) === 1 ? "a" : "e"}
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-3 w-3" />
          Aggiungi oggetto
        </Button>
      </div>

      {(!groups || groups.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nessun oggetto nell&apos;inventario. Clicca &quot;Aggiungi oggetto&quot; per
              iniziare.
            </p>
          </CardContent>
        </Card>
      )}

      {groups?.map((group) => (
        <Collapsible key={group.room} defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {group.room}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({group.items.length})
                    </span>
                  </CardTitle>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        {(item.brand || item.model) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.brand, item.model]
                              .filter(Boolean)
                              .join(" — ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={conditionLabels[item.condition]?.variant ?? "outline"}
                        >
                          {conditionLabels[item.condition]?.label ?? item.condition}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {confirmDelete === item.id ? (
                          <span className="flex items-center gap-1 text-xs">
                            Sicuro?
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              Si
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setConfirmDelete(null)}
                            >
                              No
                            </Button>
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDelete(item.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      <InventoryItemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editingItem}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
