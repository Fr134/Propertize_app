"use client";

import { useState } from "react";
import { usePurchaseOrders } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { CreateOrderDialog } from "./create-order-dialog";
import { OrderDetailDialog } from "./order-detail-dialog";

const statusLabels: Record<string, string> = {
  DRAFT: "Bozza",
  ORDERED: "Ordinato",
  RECEIVED: "Ricevuto",
  CANCELLED: "Annullato",
};

const statusVariant: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  DRAFT: "outline",
  ORDERED: "default",
  RECEIVED: "secondary",
  CANCELLED: "destructive",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OrdersTab() {
  const { data: orders, isLoading } = usePurchaseOrders();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ordini di Acquisto</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo ordine
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !orders?.length ? (
        <p className="text-sm text-muted-foreground">Nessun ordine presente.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rif.</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Righe</TableHead>
                <TableHead>Data creazione</TableHead>
                <TableHead>Data ricezione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setDetailId(order.id)}
                >
                  <TableCell className="font-medium">
                    {order.order_ref || order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[order.status] ?? "outline"}>
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.lines.length}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{formatDate(order.received_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateOrderDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {detailId && (
        <OrderDetailDialog orderId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
