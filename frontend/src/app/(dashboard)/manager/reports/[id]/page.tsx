"use client";

import { use } from "react";
import Link from "next/link";
import { useReport, useUpdateReportStatus } from "@/hooks/use-reports";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, User, Calendar } from "lucide-react";

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

export default function ManagerReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: report, isLoading } = useReport(id);
  const updateStatus = useUpdateReportStatus(id);

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (!report) return <p className="text-sm text-destructive">Segnalazione non trovata.</p>;

  async function setStatus(status: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
    await updateStatus.mutateAsync({ status });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/reports"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />{report.property.name}
          </div>
        </div>
        <StatusBadge status={report.status} type="report" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Categoria</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{categoryLabels[report.category]}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Priorita</CardTitle></CardHeader>
          <CardContent><StatusBadge status={report.priority} type="priority" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="h-3 w-3" /> Segnalato da
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm">{report.author.first_name} {report.author.last_name}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-3 w-3" /> Data
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm">{formatDate(report.created_at)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Descrizione</CardTitle></CardHeader>
        <CardContent><p className="text-sm whitespace-pre-wrap">{report.description}</p></CardContent>
      </Card>

      {report.photos.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Foto</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {report.photos.map((p) => (
                <a key={p.id} href={p.photo_url} target="_blank" rel="noopener noreferrer">
                  <img src={p.photo_url} alt="Foto segnalazione" className="h-24 w-24 rounded object-cover border" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Aggiorna stato</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {report.status !== "OPEN" && (
              <Button variant="outline" size="sm" onClick={() => setStatus("OPEN")} disabled={updateStatus.isPending}>
                Riapri
              </Button>
            )}
            {report.status !== "IN_PROGRESS" && (
              <Button variant="outline" size="sm" onClick={() => setStatus("IN_PROGRESS")} disabled={updateStatus.isPending}>
                In lavorazione
              </Button>
            )}
            {report.status !== "RESOLVED" && (
              <Button size="sm" onClick={() => setStatus("RESOLVED")} disabled={updateStatus.isPending}>
                Risolto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
