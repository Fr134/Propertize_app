"use client";

import { useState } from "react";
import {
  usePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useReceivePurchaseOrder,
} from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface OrderDetailDialogProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  DRAFT: "Bozza",
  ORDERED: "Ordinato",
  RECEIVED: "Ricevuto",
  CANCELLED: "Annullato",
};

export function OrderDetailDialog({ orderId, open, onClose }: OrderDetailDialogProps) {
  const { data: order } = usePurchaseOrder(orderId);
  const updateStatus = useUpdatePurchaseOrderStatus();
  const receiveOrder = useReceivePurchaseOrder();
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});

  if (!order) return null;

  function initReceiveQtys() {
    const qtys: Record<string, number> = {};
    for (const line of order!.lines) {
      qtys[line.supply_item_id] = line.qty_ordered;
    }
    setReceiveQtys(qtys);
  }

  async function handleStatusChange(status: string) {
    await updateStatus.mutateAsync({ id: orderId, status });
  }

  async function handleReceive() {
    const lines = order!.lines.map((l) => ({
      supply_item_id: l.supply_item_id,
      qty_received: receiveQtys[l.supply_item_id] ?? l.qty_ordered,
    }));
    await receiveOrder.mutateAsync({ id: orderId, lines });
  }

  const isPending = updateStatus.isPending || receiveOrder.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ordine {order.order_ref || order.id.slice(0, 8)}
            <Badge variant="outline">{statusLabels[order.status] ?? order.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Articolo</TableHead>
                <TableHead className="text-right">Ordinati</TableHead>
                {order.status === "ORDERED" && (
                  <TableHead className="text-right">Ricevuti</TableHead>
                )}
                {order.status === "RECEIVED" && (
                  <TableHead className="text-right">Ricevuti</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.supply_item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.qty_ordered}</TableCell>
                  {order.status === "ORDERED" && (
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        className="w-20 ml-auto text-right"
                        value={receiveQtys[line.supply_item_id] ?? line.qty_ordered}
                        onFocus={() => {
                          if (Object.keys(receiveQtys).length === 0) initReceiveQtys();
                        }}
                        onChange={(e) =>
                          setReceiveQtys({
                            ...receiveQtys,
                            [line.supply_item_id]: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                  )}
                  {order.status === "RECEIVED" && (
                    <TableCell className="text-right tabular-nums">{line.qty_received}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {order.notes && (
          <p className="text-sm text-muted-foreground">Note: {order.notes}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Chiudi</Button>

          {order.status === "DRAFT" && (
            <>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={isPending}
              >
                Annulla ordine
              </Button>
              <Button onClick={() => handleStatusChange("ORDERED")} disabled={isPending}>
                Segna come ordinato
              </Button>
            </>
          )}

          {order.status === "ORDERED" && (
            <>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={isPending}
              >
                Annulla
              </Button>
              <Button onClick={handleReceive} disabled={isPending}>
                {receiveOrder.isPending ? "Ricezione..." : "Ricevi merce"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
