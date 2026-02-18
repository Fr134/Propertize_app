"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  useAccountingProperties,
  useAccountingOwners,
  useExpenses,
  useUpdateExpense,
  type Expense,
  type AccountingOwner,
  type AccountingOwnerProperty,
} from "@/hooks/use-expenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Receipt,
  Camera,
  Check,
  X,
  Plus,
  Users,
  AlertCircle,
  FileDown,
} from "lucide-react";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// --- Expense row (used in Properties and Owners views) ---

function ExpenseRow({ expense }: { expense: Expense }) {
  const updateExpense = useUpdateExpense();
  const { toast } = useToast();

  async function togglePaid() {
    try {
      await updateExpense.mutateAsync({
        expenseId: expense.id,
        data: { is_paid: !expense.is_paid },
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore aggiornamento",
      });
    }
  }

  const isPending = updateExpense.isPending;

  return (
    <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{expense.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(expense.expense_date)}
        </p>
      </div>

      {expense.photos.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Camera className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {expense.photos.length}
          </span>
        </div>
      )}

      <div className="text-right shrink-0 w-24">
        <p className="font-semibold">{formatCurrency(expense.amount)}</p>
        {expense.vat_amount && (
          <p className="text-xs text-muted-foreground">
            IVA {formatCurrency(expense.vat_amount)}
          </p>
        )}
      </div>

      {/* Paid toggle */}
      <button
        type="button"
        onClick={togglePaid}
        disabled={isPending}
        className="flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors disabled:opacity-50"
        style={{
          backgroundColor: expense.is_paid ? "hsl(142 76% 36% / 0.1)" : undefined,
          borderColor: expense.is_paid ? "hsl(142 76% 36%)" : undefined,
        }}
        title={expense.is_paid ? "Segna come non pagata" : "Segna come pagata"}
      >
        {expense.is_paid ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <X className="h-3 w-3 text-muted-foreground" />
        )}
        Pagata
      </button>
    </div>
  );
}

// --- Selectable expense row (used in "Da pagare" view) ---

interface SelectedExpenseEntry {
  expense: Expense;
  ownerName: string;
  propertyName: string;
  propertyCode: string;
}

function DueExpenseRow({
  expense,
  isSelected,
  onToggleSelect,
}: {
  expense: Expense;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const updateExpense = useUpdateExpense();
  const { toast } = useToast();

  async function togglePaid(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await updateExpense.mutateAsync({
        expenseId: expense.id,
        data: { is_paid: !expense.is_paid },
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore aggiornamento",
      });
    }
  }

  const isPending = updateExpense.isPending;

  return (
    <div
      className={`flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer transition-colors ${
        isSelected ? "border-orange-400 bg-orange-50/60" : "hover:bg-muted/30"
      }`}
      onClick={onToggleSelect}
    >
      {/* Checkbox */}
      <div
        className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? "border-orange-500 bg-orange-500"
            : "border-muted-foreground/40"
        }`}
      >
        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{expense.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(expense.expense_date)}
        </p>
      </div>

      {expense.photos.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Camera className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {expense.photos.length}
          </span>
        </div>
      )}

      <div className="text-right shrink-0 w-24">
        <p className="font-semibold">{formatCurrency(expense.amount)}</p>
        {expense.vat_amount && (
          <p className="text-xs text-muted-foreground">
            IVA {formatCurrency(expense.vat_amount)}
          </p>
        )}
      </div>

      {/* Paid toggle — stops propagation so it doesn't toggle selection */}
      <button
        type="button"
        onClick={togglePaid}
        disabled={isPending}
        className="flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors disabled:opacity-50 shrink-0"
        style={{
          backgroundColor: expense.is_paid ? "hsl(142 76% 36% / 0.1)" : undefined,
          borderColor: expense.is_paid ? "hsl(142 76% 36%)" : undefined,
        }}
        title={expense.is_paid ? "Segna come non pagata" : "Segna come pagata"}
      >
        {expense.is_paid ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <X className="h-3 w-3 text-muted-foreground" />
        )}
        Pagata
      </button>
    </div>
  );
}

// --- Property accordion section (Properties view) ---

function PropertySection({
  property,
}: {
  property: {
    id: string;
    name: string;
    code: string;
    expenseCount: number;
    totalExpenses: number;
    billedTotal: number;
    paidTotal: number;
    dueTotal: number;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: expenses, isLoading } = useExpenses(
    expanded ? property.id : ""
  );

  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <CardContent className="flex items-center gap-4 py-4">
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{property.name}</p>
              <Badge variant="outline" className="text-xs">{property.code}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {property.expenseCount} spese
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right text-xs shrink-0">
            <div>
              <p className="text-muted-foreground">Fatturato</p>
              <p className="font-semibold">{formatCurrency(property.billedTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagato</p>
              <p className="font-semibold text-green-700">{formatCurrency(property.paidTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Da pagare</p>
              <p className="font-semibold text-orange-700">{formatCurrency(property.dueTotal)}</p>
            </div>
          </div>
        </CardContent>
      </button>
      {expanded && (
        <div className="border-t px-4 pb-4">
          <div className="flex items-center justify-between py-3">
            <p className="text-xs font-medium text-muted-foreground">
              Totale spese: {formatCurrency(property.totalExpenses)}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/manager/properties/${property.id}/accounting/new?from=overview`}>
                <Plus className="mr-1 h-3 w-3" />
                Nuova spesa
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-2">Caricamento...</p>
          ) : !expenses || expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nessuna spesa registrata.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// --- Owner's property nested accordion (Owners view) ---

function OwnerPropertySection({ property }: { property: AccountingOwnerProperty }) {
  const [expanded, setExpanded] = useState(false);
  const { data: expenses, isLoading } = useExpenses(expanded ? property.id : "");

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-2"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-xs">{property.name}</p>
              <Badge variant="outline" className="text-xs">{property.code}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{property.expenseCount} spese</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right text-xs shrink-0">
            <div>
              <p className="text-muted-foreground">Fatturato</p>
              <p className="font-semibold">{formatCurrency(property.billedTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagato</p>
              <p className="font-semibold text-green-700">{formatCurrency(property.paidTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Da pagare</p>
              <p className="font-semibold text-orange-700">{formatCurrency(property.dueTotal)}</p>
            </div>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t px-3 pb-3">
          <div className="flex items-center justify-between py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Totale: {formatCurrency(property.totalExpenses)}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/manager/properties/${property.id}/accounting/new?from=overview`}>
                <Plus className="mr-1 h-3 w-3" />
                Nuova spesa
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-2">Caricamento...</p>
          ) : !expenses || expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nessuna spesa registrata.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Owner accordion section (Owners view) ---

function OwnerSection({ owner }: { owner: AccountingOwner }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <CardContent className="flex items-center gap-4 py-4">
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{owner.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {owner.propertyCount}{" "}
              {owner.propertyCount === 1 ? "immobile" : "immobili"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right text-xs shrink-0">
            <div>
              <p className="text-muted-foreground">Fatturato</p>
              <p className="font-semibold">{formatCurrency(owner.billedTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagato</p>
              <p className="font-semibold text-green-700">{formatCurrency(owner.paidTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Da pagare</p>
              <p className="font-semibold text-orange-700">{formatCurrency(owner.dueTotal)}</p>
            </div>
          </div>
        </CardContent>
      </button>
      {expanded && (
        <div className="border-t px-4 pb-4">
          <p className="text-xs font-medium text-muted-foreground py-3">
            Totale spese: {formatCurrency(owner.totalExpenses)}
          </p>
          {owner.properties.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nessun immobile associato.</p>
          ) : (
            <div className="space-y-2">
              {owner.properties.map((property) => (
                <OwnerPropertySection key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// --- "Da pagare" tab: property section with selectable expenses ---

function DueOwnerPropertySection({
  property,
  ownerName,
  selection,
  onToggle,
}: {
  property: AccountingOwnerProperty;
  ownerName: string;
  selection: Map<string, SelectedExpenseEntry>;
  onToggle: (entry: SelectedExpenseEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: allExpenses, isLoading } = useExpenses(
    expanded ? property.id : ""
  );
  const unpaidExpenses = allExpenses?.filter((e) => !e.is_paid);

  return (
    <div className="rounded-md border border-orange-200">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-2"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-xs">{property.name}</p>
              <Badge variant="outline" className="text-xs">{property.code}</Badge>
            </div>
          </div>
          <div className="text-right text-xs shrink-0">
            <p className="text-muted-foreground">Da pagare</p>
            <p className="font-semibold text-orange-700">{formatCurrency(property.dueTotal)}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3 pb-3">
          <div className="flex items-center justify-between py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Clicca su una spesa per selezionarla
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/manager/properties/${property.id}/accounting/new?from=overview`}>
                <Plus className="mr-1 h-3 w-3" />
                Nuova spesa
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-2">Caricamento...</p>
          ) : !unpaidExpenses || unpaidExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nessuna spesa da pagare.</p>
          ) : (
            <div className="space-y-2">
              {unpaidExpenses.map((expense) => (
                <DueExpenseRow
                  key={expense.id}
                  expense={expense}
                  isSelected={selection.has(expense.id)}
                  onToggleSelect={() =>
                    onToggle({
                      expense,
                      ownerName,
                      propertyName: property.name,
                      propertyCode: property.code,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- "Da pagare" tab: owner section ---

function DueOwnerSection({
  owner,
  selection,
  onToggle,
}: {
  owner: AccountingOwner & { properties: AccountingOwnerProperty[] };
  selection: Map<string, SelectedExpenseEntry>;
  onToggle: (entry: SelectedExpenseEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-orange-200">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <CardContent className="flex items-center gap-4 py-4">
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{owner.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {owner.properties.length}{" "}
              {owner.properties.length === 1
                ? "immobile con importi in sospeso"
                : "immobili con importi in sospeso"}
            </p>
          </div>
          <div className="text-right text-xs shrink-0">
            <p className="text-muted-foreground">Totale da pagare</p>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(owner.dueTotal)}
            </p>
          </div>
        </CardContent>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4">
          <p className="text-xs font-medium text-muted-foreground py-3">
            Immobili con importi da saldare
          </p>
          {owner.properties.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Nessun immobile con spese da pagare.
            </p>
          ) : (
            <div className="space-y-2">
              {owner.properties.map((property) => (
                <DueOwnerPropertySection
                  key={property.id}
                  property={property}
                  ownerName={owner.name}
                  selection={selection}
                  onToggle={onToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// --- PDF generation ---

async function generatePDF(
  selection: Map<string, SelectedExpenseEntry>
) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Report Spese Da Pagare", margin, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  const today = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generato il ${today}`, margin, 27);
  doc.setTextColor(0);

  // Group by owner → property
  const grouped = new Map<
    string,
    { ownerName: string; properties: Map<string, { propertyName: string; propertyCode: string; expenses: Expense[] }> }
  >();

  for (const entry of selection.values()) {
    if (!grouped.has(entry.ownerName)) {
      grouped.set(entry.ownerName, { ownerName: entry.ownerName, properties: new Map() });
    }
    const ownerGroup = grouped.get(entry.ownerName)!;
    const propKey = `${entry.propertyName}__${entry.propertyCode}`;
    if (!ownerGroup.properties.has(propKey)) {
      ownerGroup.properties.set(propKey, {
        propertyName: entry.propertyName,
        propertyCode: entry.propertyCode,
        expenses: [],
      });
    }
    ownerGroup.properties.get(propKey)!.expenses.push(entry.expense);
  }

  let y = 35;
  let grandTotal = 0;

  for (const ownerGroup of grouped.values()) {
    // Owner header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 60, 0);
    doc.text(`Proprietario: ${ownerGroup.ownerName}`, margin, y);
    doc.setTextColor(0);
    y += 6;

    for (const propGroup of ownerGroup.properties.values()) {
      // Property sub-header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${propGroup.propertyName}  (${propGroup.propertyCode})`,
        margin + 4,
        y
      );
      y += 5;

      const rows = propGroup.expenses.map((e) => [
        e.description,
        formatDate(e.expense_date),
        formatCurrency(e.amount),
        e.vat_amount ? formatCurrency(e.vat_amount) : "-",
      ]);

      const subtotal = propGroup.expenses.reduce(
        (s, e) => s + Number(e.amount),
        0
      );
      grandTotal += subtotal;

      autoTable(doc, {
        startY: y,
        head: [["Descrizione", "Data", "Importo", "IVA"]],
        body: rows,
        foot: [["", "Subtotale", formatCurrency(subtotal), ""]],
        margin: { left: margin + 4, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [255, 237, 213], textColor: [180, 60, 0], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: 28, halign: "right" },
          3: { cellWidth: 22, halign: "right" },
        },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

    y += 4;
  }

  // Grand total
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 60, 0);
  doc.text("TOTALE DA PAGARE", margin, y);
  doc.text(formatCurrency(grandTotal), pageW - margin, y, { align: "right" });
  doc.setTextColor(0);

  doc.save("report-spese-da-pagare.pdf");
}

// --- Main page ---

type View = "properties" | "owners" | "da_pagare";

export default function AccountingOverviewPage() {
  const [view, setView] = useState<View>("properties");
  const { data: properties, isLoading: propertiesLoading } =
    useAccountingProperties();
  const { data: owners, isLoading: ownersLoading } = useAccountingOwners();

  // Selection state for "Da pagare" tab
  const [selection, setSelection] = useState<Map<string, SelectedExpenseEntry>>(
    new Map()
  );

  const toggleSelection = useCallback((entry: SelectedExpenseEntry) => {
    setSelection((prev) => {
      const next = new Map(prev);
      if (next.has(entry.expense.id)) {
        next.delete(entry.expense.id);
      } else {
        next.set(entry.expense.id, entry);
      }
      return next;
    });
  }, []);

  const [generatingPDF, setGeneratingPDF] = useState(false);

  async function handleGeneratePDF() {
    setGeneratingPDF(true);
    try {
      await generatePDF(selection);
    } finally {
      setGeneratingPDF(false);
    }
  }

  // Owners with at least one unpaid expense, properties filtered to dueTotal > 0
  const dueOwners = useMemo(() => {
    return (owners ?? [])
      .map((o) => ({
        ...o,
        properties: o.properties.filter((p) => p.dueTotal > 0),
      }))
      .filter((o) => o.dueTotal > 0);
  }, [owners]);

  const isLoading =
    view === "properties" ? propertiesLoading : ownersLoading;

  const totals =
    view === "properties"
      ? (properties ?? []).reduce(
          (acc, p) => ({
            totalExpenses: acc.totalExpenses + p.totalExpenses,
            billedTotal: acc.billedTotal + p.billedTotal,
            paidTotal: acc.paidTotal + p.paidTotal,
            dueTotal: acc.dueTotal + p.dueTotal,
          }),
          { totalExpenses: 0, billedTotal: 0, paidTotal: 0, dueTotal: 0 }
        )
      : view === "owners"
      ? (owners ?? []).reduce(
          (acc, o) => ({
            totalExpenses: acc.totalExpenses + o.totalExpenses,
            billedTotal: acc.billedTotal + o.billedTotal,
            paidTotal: acc.paidTotal + o.paidTotal,
            dueTotal: acc.dueTotal + o.dueTotal,
          }),
          { totalExpenses: 0, billedTotal: 0, paidTotal: 0, dueTotal: 0 }
        )
      : dueOwners.reduce(
          (acc, o) => ({
            totalExpenses: acc.totalExpenses + o.totalExpenses,
            billedTotal: acc.billedTotal + o.billedTotal,
            paidTotal: acc.paidTotal + o.paidTotal,
            dueTotal: acc.dueTotal + o.dueTotal,
          }),
          { totalExpenses: 0, billedTotal: 0, paidTotal: 0, dueTotal: 0 }
        );

  const subtitle =
    view === "properties"
      ? "Riepilogo spese per immobile"
      : view === "owners"
      ? "Riepilogo spese per proprietario"
      : "Spese da addebitare non ancora pagate";

  const selectedTotal = Array.from(selection.values()).reduce(
    (s, e) => s + Number(e.expense.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contabilità</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={view === "properties" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("properties")}
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5" />
            Immobili
          </Button>
          <Button
            variant={view === "owners" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("owners")}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Proprietari
          </Button>
          <Button
            variant={view === "da_pagare" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("da_pagare")}
          >
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
            Da pagare
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      {view === "da_pagare" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-orange-200 bg-orange-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                Totale da pagare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrency(totals.dueTotal)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Proprietari con saldo in sospeso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dueOwners.length}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totale spese</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fatturato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.billedTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pagato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.paidTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Da pagare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(totals.dueTotal)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selection action bar for "Da pagare" */}
      {view === "da_pagare" && selection.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-orange-300 bg-orange-50 px-4 py-3">
          <div className="text-sm">
            <span className="font-semibold text-orange-800">
              {selection.size} {selection.size === 1 ? "spesa selezionata" : "spese selezionate"}
            </span>
            <span className="text-orange-700 ml-2">
              — Totale: {formatCurrency(selectedTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelection(new Map())}
            >
              Deseleziona tutto
            </Button>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
            >
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              {generatingPDF ? "Generazione..." : "Genera Report PDF"}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : view === "properties" ? (
        !properties || properties.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nessun immobile trovato.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <PropertySection key={property.id} property={property} />
            ))}
          </div>
        )
      ) : view === "owners" ? (
        !owners || owners.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nessun proprietario trovato.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {owners.map((owner) => (
              <OwnerSection key={owner.id} owner={owner} />
            ))}
          </div>
        )
      ) : dueOwners.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nessuna spesa da pagare. Tutto in regola!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dueOwners.map((owner) => (
            <DueOwnerSection
              key={owner.id}
              owner={owner}
              selection={selection}
              onToggle={toggleSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
}
