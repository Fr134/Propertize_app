"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useTeam, type TeamMember } from "@/hooks/use-team";

interface ReassignSelectProps {
  currentAssignee: { id: string; first_name: string; last_name: string } | null;
  /** Permission field to filter eligible managers */
  permissionField: keyof Pick<
    TeamMember,
    | "can_manage_leads"
    | "can_do_analysis"
    | "can_manage_operations"
    | "can_manage_finance"
    | "can_manage_team"
    | "can_manage_onboarding"
  >;
  onReassign: (userId: string) => void;
  isPending?: boolean;
}

export function ReassignSelect({
  currentAssignee,
  permissionField,
  onReassign,
  isPending,
}: ReassignSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const { data: team = [] } = useTeam();

  const eligibleManagers = team.filter(
    (u) =>
      u.role === "MANAGER" &&
      u.active &&
      (u.is_super_admin || u[permissionField]) &&
      u.id !== currentAssignee?.id
  );

  const handleConfirm = () => {
    if (selectedUserId) {
      onReassign(selectedUserId);
      setOpen(false);
      setSelectedUserId("");
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Assegnato a:</span>
      <span className="font-medium">
        {currentAssignee
          ? `${currentAssignee.first_name} ${currentAssignee.last_name}`
          : "Non assegnato"}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Riassegna
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Riassegna</DialogTitle>
            <DialogDescription>
              Seleziona il manager a cui assegnare questo elemento.
            </DialogDescription>
          </DialogHeader>

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona manager..." />
            </SelectTrigger>
            <SelectContent>
              {eligibleManagers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}
                </SelectItem>
              ))}
              {eligibleManagers.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Nessun manager disponibile
                </div>
              )}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedUserId || isPending}
            >
              {isPending ? "Salvataggio..." : "Conferma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
