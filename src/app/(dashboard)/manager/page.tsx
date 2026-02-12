"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, AlertTriangle, Package, CheckCircle } from "lucide-react";
import { useManagerDashboard } from "@/hooks/use-dashboard";
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";
import Link from "next/link";

export default function ManagerDashboardPage() {
  const { data, isLoading, error } = useManagerDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-destructive">Errore nel caricamento dei dati.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/manager/tasks?status=COMPLETED">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                In attesa di approvazione
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.pendingApprovalCount}</div>
              <p className="text-xs text-muted-foreground">task completati</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/manager/reports?status=OPEN">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Segnalazioni aperte
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.openReportsCount}</div>
              <p className="text-xs text-muted-foreground">da gestire</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/manager/supplies">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Scorte in esaurimento
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.lowSupplyPropertiesCount}</div>
              <p className="text-xs text-muted-foreground">immobili</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Task oggi
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.todayTasksCompleted} / {data.todayTasksTotal}
            </div>
            <p className="text-xs text-muted-foreground">completati / totali</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
