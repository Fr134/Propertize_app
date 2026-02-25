"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { useTeam, type TeamMember } from "@/hooks/use-team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteMemberSheet } from "@/components/manager/team/invite-member-sheet";
import { UserPlus, Users2 } from "lucide-react";

const PERMISSION_BADGES: {
  key: keyof TeamMember;
  label: string;
  className: string;
}[] = [
  { key: "is_super_admin", label: "Super Admin", className: "bg-gray-900 text-white hover:bg-gray-900" },
  { key: "can_manage_leads", label: "CRM", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  { key: "can_do_analysis", label: "Analisi", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  { key: "can_manage_operations", label: "Operazioni", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  { key: "can_manage_finance", label: "Finanza", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  { key: "can_manage_team", label: "Team", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  { key: "can_manage_onboarding", label: "Onboarding", className: "bg-teal-100 text-teal-800 hover:bg-teal-100" },
];

function PermissionBadges({ member }: { member: TeamMember }) {
  const badges = PERMISSION_BADGES.filter((b) => member[b.key] === true);
  if (badges.length === 0) return <span className="text-xs text-muted-foreground">Nessun permesso</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <Badge key={b.key} variant="secondary" className={b.className}>
          {b.label}
        </Badge>
      ))}
    </div>
  );
}

function WorkloadBadges({ member }: { member: TeamMember }) {
  const items = [
    { label: "CRM", count: member.leads_assignment_count, className: "bg-blue-50 text-blue-700" },
    { label: "Analisi", count: member.analysis_assignment_count, className: "bg-purple-50 text-purple-700" },
    { label: "Ops", count: member.operations_assignment_count, className: "bg-green-50 text-green-700" },
    { label: "Onb", count: member.onboarding_assignment_count, className: "bg-teal-50 text-teal-700" },
  ].filter((i) => i.count > 0);

  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((i) => (
        <Badge key={i.label} variant="secondary" className={`${i.className} text-xs`}>
          {i.label} {i.count}
        </Badge>
      ))}
    </div>
  );
}

function TeamTable({ members, showPermissions }: { members: TeamMember[]; showPermissions: boolean }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Nessun membro</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefono</TableHead>
          {showPermissions && <TableHead>Permessi</TableHead>}
          {showPermissions && <TableHead>Carico attivo</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <Link
                href={`/manager/team/${m.id}`}
                className="font-medium text-primary hover:underline"
              >
                {m.first_name} {m.last_name}
              </Link>
            </TableCell>
            <TableCell>{m.email}</TableCell>
            <TableCell>{m.phone || "—"}</TableCell>
            {showPermissions && (
              <TableCell>
                <PermissionBadges member={m} />
              </TableCell>
            )}
            {showPermissions && (
              <TableCell>
                <WorkloadBadges member={m} />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function TeamPage() {
  const { allowed, loading: permLoading } = useRequirePermission("can_manage_team");
  const { data: members, isLoading } = useTeam();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (permLoading || !allowed) return null;

  const managers = members?.filter((m) => m.role === "MANAGER") ?? [];
  const operators = members?.filter((m) => m.role === "OPERATOR") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">Gestisci i membri del team e i loro permessi</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuovo membro
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-2">Manager</h2>
            <TeamTable members={managers} showPermissions />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Operatrici</h2>
            <TeamTable members={operators} showPermissions={false} />
          </div>
        </>
      )}

      {!isLoading && members?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nessun membro del team</p>
        </div>
      )}

      <InviteMemberSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
