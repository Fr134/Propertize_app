"use client";

import Link from "next/link";
import { useReports } from "@/hooks/use-reports";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

const categoryLabels: Record<string, string> = {
  DANNO: "Danno",
  MANUTENZIONE: "Manutenzione",
  OGGETTO_MANCANTE: "Oggetto mancante",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function ManagerReportsPage() {
  const { data: reports, isLoading } = useReports();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Segnalazioni</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !reports?.length ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <AlertTriangle className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nessuna segnalazione.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Immobile</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Priorita</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/manager/reports/${r.id}`} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.property.name}</TableCell>
                  <TableCell>{categoryLabels[r.category] ?? r.category}</TableCell>
                  <TableCell><StatusBadge status={r.priority} type="priority" /></TableCell>
                  <TableCell><StatusBadge status={r.status} type="report" /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
