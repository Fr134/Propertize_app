"use client";

import { useState } from "react";
import { useInventoryForecast } from "@/hooks/use-inventory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export function ForecastTab() {
  const [days, setDays] = useState(30);
  const { data: forecast, isLoading } = useInventoryForecast(days);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Previsioni</h3>

      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Periodo analisi (giorni)</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 30)}
            className="w-28"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !forecast?.length ? (
        <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Articolo</TableHead>
                <TableHead className="text-right">Giacenza</TableHead>
                <TableHead className="text-right">Consumo/giorno</TableHead>
                <TableHead className="text-right">Giorni rimasti</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecast.map((item) => (
                <TableRow key={item.supply_item_id}>
                  <TableCell className="font-medium">
                    {item.name}
                    <span className="ml-1 text-xs text-muted-foreground">({item.unit})</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.qty_on_hand}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.avg_daily}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.days_remaining !== null ? item.days_remaining : "∞"}
                  </TableCell>
                  <TableCell>
                    {item.needs_reorder ? (
                      <Badge variant="destructive">Riordinare</Badge>
                    ) : (
                      <Badge variant="outline">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
