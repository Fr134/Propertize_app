"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { hasPermission, type Permission } from "@/lib/permissions";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  AlertTriangle,
  Package,
  CheckSquare,
  Receipt,
  Users,
  Users2,
  ContactRound,
  TrendingUp,
  ListChecks,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: Permission;
}

const managerNav: NavItem[] = [
  { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { label: "Immobili", href: "/manager/properties", icon: Building2 },
  { label: "Proprietari", href: "/manager/owners", icon: Users },
  { label: "Contatti", href: "/manager/contacts", icon: ContactRound, permission: "can_manage_operations" },
  { label: "CRM", href: "/manager/crm", icon: TrendingUp, permission: "can_manage_leads" },
  { label: "Onboarding", href: "/manager/crm/onboarding", icon: ListChecks, permission: "can_manage_onboarding" },
  { label: "Task", href: "/manager/tasks", icon: ClipboardList },
  { label: "Segnalazioni", href: "/manager/reports", icon: AlertTriangle },
  { label: "Scorte", href: "/manager/supplies", icon: Package },
  { label: "Contabilità", href: "/manager/accounting", icon: Receipt, permission: "can_manage_finance" },
  { label: "Team", href: "/manager/team", icon: Users2, permission: "can_manage_team" },
];

const operatorNav: NavItem[] = [
  { label: "I miei Task", href: "/operator", icon: CheckSquare },
  { label: "Segnalazioni", href: "/operator/reports", icon: AlertTriangle },
];

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const items = role === "MANAGER" ? managerNav : operatorNav;

  const visibleItems = items.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(session, item.permission);
  });

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {visibleItems.map((item) => {
        const isActive =
          item.href === `/${role.toLowerCase()}`
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
