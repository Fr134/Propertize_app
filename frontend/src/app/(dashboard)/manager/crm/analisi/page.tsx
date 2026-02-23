"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ArrowLeft, Eye } from "lucide-react";
import { useAnalyses } from "@/hooks/use-analysis";
import { getAuthToken } from "@/lib/fetch";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "In attesa",
  IN_PROGRESS: "In lavorazione",
  COMPLETED: "Completata",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APPARTAMENTO: "Appartamento",
  VILLA: "Villa",
  ALTRO: "Altro",
};

export default function AnalisiListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: analyses = [], isLoading } = useAnalyses(
    statusFilter === "all" ? undefined : statusFilter
  );

  async function handleExport() {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const token = getAuthToken();
    const res = await fetch(`${base}/api/analysis/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analisi-immobili.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/crm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Analisi immobili</h1>
          <p className="text-sm text-muted-foreground">
            Richieste di analisi ricevute dai potenziali proprietari
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Esporta Excel
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="PENDING">In attesa</SelectItem>
            <SelectItem value="IN_PROGRESS">In lavorazione</SelectItem>
            <SelectItem value="COMPLETED">Completata</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : analyses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nessuna analisi trovata
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Indirizzo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">
                    {new Date(a.submitted_at).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{a.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.client_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {a.property_address}
                  </TableCell>
                  <TableCell className="text-sm">
                    {PROPERTY_TYPE_LABELS[a.property_type] ?? a.property_type}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[a.status] ?? ""}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/manager/crm/analisi/${a.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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
