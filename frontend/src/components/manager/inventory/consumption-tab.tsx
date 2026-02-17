"use client";

import { useState } from "react";
import { useConsumptionSummary } from "@/hooks/use-inventory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export function ConsumptionTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: summary, isLoading } = useConsumptionSummary({
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Consumi</h3>

      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Da</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">A</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !summary?.length ? (
        <p className="text-sm text-muted-foreground">Nessun consumo registrato nel periodo selezionato.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Articolo</TableHead>
                <TableHead className="text-right">Quantità consumata</TableHead>
                <TableHead className="text-right">N. transazioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((item) => (
                <TableRow key={item.supply_item_id}>
                  <TableCell className="font-medium">
                    {item.name}
                    <span className="ml-1 text-xs text-muted-foreground">({item.unit})</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.total_qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.tx_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
