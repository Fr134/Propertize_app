"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequirePermission } from "@/hooks/use-require-permission";
import {
  useTeamMember,
  useUpdateTeamMember,
  useUpdatePermissions,
  useResetPassword,
  useDeactivateTeamMember,
} from "@/hooks/use-team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const PERMISSION_OPTIONS = [
  { key: "can_manage_leads" as const, label: "CRM", description: "Gestione lead, trattative" },
  { key: "can_do_analysis" as const, label: "Analisi", description: "Analisi di mercato" },
  { key: "can_manage_operations" as const, label: "Operativo", description: "Task, immobili, checklist, magazzino" },
  { key: "can_manage_finance" as const, label: "Finanza", description: "Spese, contabilità" },
  { key: "can_manage_team" as const, label: "Team", description: "Creazione e gestione account" },
  { key: "can_manage_onboarding" as const, label: "Onboarding", description: "Onboarding proprietari" },
];

export default function TeamMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { allowed, loading: permLoading } = useRequirePermission("can_manage_team");

  const { data: member, isLoading } = useTeamMember(id);
  const updateMember = useUpdateTeamMember();
  const updatePermissions = useUpdatePermissions();
  const resetPassword = useResetPassword();
  const deactivate = useDeactivateTeamMember();

  const [editForm, setEditForm] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null>(null);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Initialize edit form when member loads
  if (member && !editForm) {
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || "",
    });
  }

  if (permLoading || !allowed) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!member) {
    return <p className="text-muted-foreground">Utente non trovato</p>;
  }

  async function handleSaveInfo() {
    if (!editForm) return;
    try {
      await updateMember.mutateAsync({ id, data: editForm });
      toast({ variant: "success", title: "Informazioni aggiornate" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nel salvataggio",
      });
    }
  }

  async function handleTogglePermission(key: string, value: boolean) {
    try {
      await updatePermissions.mutateAsync({
        id,
        data: { [key]: value },
      });
      toast({ variant: "success", title: "Permesso aggiornato" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nell'aggiornamento",
      });
    }
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "La password deve avere almeno 6 caratteri" });
      return;
    }
    try {
      await resetPassword.mutateAsync({ id, password: newPassword });
      toast({ variant: "success", title: "Password reimpostata" });
      setResetDialogOpen(false);
      setNewPassword("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nel reset",
      });
    }
  }

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync(id);
      toast({ variant: "success", title: "Account disattivato" });
      router.push("/manager/team");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nella disattivazione",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/manager/team">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {member.first_name} {member.last_name}
            </h1>
            <Badge variant={member.role === "MANAGER" ? "default" : "secondary"}>
              {member.role === "MANAGER" ? "Manager" : "Operatrice"}
            </Badge>
            {member.is_super_admin && (
              <Badge className="bg-gray-900 text-white hover:bg-gray-900">Super Admin</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {member.active ? "Account attivo" : "Account disattivato"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Info */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Informazioni</h2>

          {editForm && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cognome</Label>
                  <Input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div>
                <Label>Telefono</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <Button
                onClick={handleSaveInfo}
                disabled={updateMember.isPending}
              >
                {updateMember.isPending ? "Salvataggio..." : "Salva modifiche"}
              </Button>
            </>
          )}
        </div>

        {/* Right column: Permissions (MANAGER only) */}
        {member.role === "MANAGER" && (
          <div className="space-y-4 rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Permessi</h2>

            {PERMISSION_OPTIONS.map((perm) => (
              <div key={perm.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{perm.label}</p>
                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                </div>
                <Switch
                  checked={member[perm.key]}
                  onCheckedChange={(checked) => handleTogglePermission(perm.key, checked)}
                  disabled={updatePermissions.isPending || member.is_super_admin}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setResetDialogOpen(true)}>
          Reimposta password
        </Button>
        <Button
          variant="destructive"
          onClick={() => setDeactivateDialogOpen(true)}
        >
          Disattiva account
        </Button>
      </div>

      {/* Reset password dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reimposta password</DialogTitle>
            <DialogDescription>
              Inserisci la nuova password per {member.first_name} {member.last_name}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Nuova password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleResetPassword} disabled={resetPassword.isPending}>
              {resetPassword.isPending ? "Reimpostazione..." : "Reimposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate alert dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disattiva account</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler disattivare l&apos;account di {member.first_name} {member.last_name}?
              L&apos;utente non potrà più accedere al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivate.isPending ? "Disattivazione..." : "Disattiva"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
