"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Eye, Plus } from "lucide-react";
import {
  useOnboardingList,
  useStartOnboarding,
} from "@/hooks/use-onboarding";
import { useOwners } from "@/hooks/use-owners";

export default function OnboardingListPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: workflows = [], isLoading } = useOnboardingList(
    filter === "all" ? undefined : filter
  );
  const { data: owners = [] } = useOwners();
  const startOnboarding = useStartOnboarding();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Owners without an existing workflow
  const workflowOwnerIds = new Set(workflows.map((w) => w.owner_id));
  const availableOwners = owners.filter((o) => !workflowOwnerIds.has(o.id));

  async function handleStart(ownerId: string) {
    try {
      await startOnboarding.mutateAsync(ownerId);
      setDialogOpen(false);
    } catch {
      // error via mutation state
    }
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
          <h1 className="text-2xl font-bold tracking-tight">
            Onboarding Proprietari
          </h1>
          <p className="text-sm text-muted-foreground">
            Workflow guidato per i nuovi proprietari
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Avvia onboarding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Seleziona proprietario</DialogTitle>
            </DialogHeader>
            {availableOwners.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Tutti i proprietari hanno già un onboarding avviato
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableOwners.map((owner) => (
                  <button
                    key={owner.id}
                    className="w-full flex items-center justify-between rounded-md border p-3 hover:bg-muted transition-colors text-left"
                    onClick={() => handleStart(owner.id)}
                    disabled={startOnboarding.isPending}
                  >
                    <div>
                      <p className="text-sm font-medium">{owner.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {owner.email ?? "Nessuna email"}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="false">In corso</SelectItem>
            <SelectItem value="true">Completati</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : workflows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nessun onboarding trovato
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proprietario</TableHead>
                <TableHead>Progressione</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data inizio</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((w) => {
                const pct =
                  w.progress.total > 0
                    ? Math.round(
                        (w.progress.completed / w.progress.total) * 100
                      )
                    : 0;
                return (
                  <TableRow key={w.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{w.owner.name}</p>
                      {w.owner.email && (
                        <p className="text-xs text-muted-foreground">
                          {w.owner.email}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {w.progress.completed}/{w.progress.total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {w.completed_at ? (
                        <Badge className="bg-green-100 text-green-800">
                          Completato
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          In corso
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(w.started_at).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/manager/crm/onboarding/${w.owner_id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
