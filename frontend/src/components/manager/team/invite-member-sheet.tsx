"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { useInviteTeamMember } from "@/hooks/use-team";

interface InviteMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERMISSION_OPTIONS = [
  { key: "can_manage_leads", label: "CRM", description: "Gestione lead, trattative" },
  { key: "can_do_analysis", label: "Analisi", description: "Analisi di mercato" },
  { key: "can_manage_operations", label: "Operativo", description: "Task, immobili, checklist, magazzino" },
  { key: "can_manage_finance", label: "Finanza", description: "Spese, contabilità" },
  { key: "can_manage_team", label: "Team", description: "Creazione e gestione account" },
  { key: "can_manage_onboarding", label: "Onboarding", description: "Onboarding proprietari" },
] as const;

type PermissionKey = (typeof PERMISSION_OPTIONS)[number]["key"];

export function InviteMemberSheet({ open, onOpenChange }: InviteMemberSheetProps) {
  const { toast } = useToast();
  const invite = useInviteTeamMember();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "MANAGER" as "MANAGER" | "OPERATOR",
    phone: "",
    can_manage_leads: false,
    can_do_analysis: false,
    can_manage_operations: false,
    can_manage_finance: false,
    can_manage_team: false,
    can_manage_onboarding: false,
  });

  function resetForm() {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "MANAGER",
      phone: "",
      can_manage_leads: false,
      can_do_analysis: false,
      can_manage_operations: false,
      can_manage_finance: false,
      can_manage_team: false,
      can_manage_onboarding: false,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast({ variant: "destructive", title: "Le password non coincidono" });
      return;
    }

    if (form.password.length < 6) {
      toast({ variant: "destructive", title: "La password deve avere almeno 6 caratteri" });
      return;
    }

    try {
      await invite.mutateAsync({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        can_manage_leads: form.can_manage_leads,
        can_do_analysis: form.can_do_analysis,
        can_manage_operations: form.can_manage_operations,
        can_manage_finance: form.can_manage_finance,
        can_manage_team: form.can_manage_team,
        can_manage_onboarding: form.can_manage_onboarding,
      });

      toast({ variant: "success", title: "Membro del team creato" });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nella creazione",
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuovo membro del team</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <Label>Ruolo</Label>
            <RadioGroup
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as "MANAGER" | "OPERATOR" })}
              className="flex gap-4 mt-1"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="MANAGER" id="role-manager" />
                <Label htmlFor="role-manager" className="font-normal">Manager</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="OPERATOR" id="role-operator" />
                <Label htmlFor="role-operator" className="font-normal">Operatrice</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Conferma password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          {form.role === "MANAGER" && (
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium">Permessi</Label>
              {PERMISSION_OPTIONS.map((perm) => (
                <div key={perm.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{perm.label}</p>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                  <Switch
                    checked={form[perm.key]}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, [perm.key]: checked })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={invite.isPending}>
            {invite.isPending ? "Creazione..." : "Crea membro"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
