"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAccountingProperties,
  useExpenses,
  useUpdateExpense,
  type Expense,
} from "@/hooks/use-expenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronDown,
  ChevronRight,
  Receipt,
  Camera,
  Check,
  X,
  Plus,
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

// --- Expense row with toggle checkboxes ---

function ExpenseRow({ expense }: { expense: Expense }) {
  const updateExpense = useUpdateExpense();
  const { toast } = useToast();

  async function toggleBilled() {
    try {
      await updateExpense.mutateAsync({
        expenseId: expense.id,
        data: { is_billed: !expense.is_billed },
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore aggiornamento",
      });
    }
  }

  async function togglePaid() {
    if (!expense.is_billed) {
      toast({
        variant: "destructive",
        title: "Non fatturata",
        description: "Devi prima segnare la spesa come fatturata.",
      });
      return;
    }
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

      {/* Billed toggle */}
      <button
        type="button"
        onClick={toggleBilled}
        disabled={isPending}
        className="flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors disabled:opacity-50"
        style={{
          backgroundColor: expense.is_billed ? "hsl(var(--primary) / 0.1)" : undefined,
          borderColor: expense.is_billed ? "hsl(var(--primary))" : undefined,
        }}
        title={expense.is_billed ? "Segna come non fatturata" : "Segna come fatturata"}
      >
        {expense.is_billed ? (
          <Check className="h-3 w-3 text-primary" />
        ) : (
          <X className="h-3 w-3 text-muted-foreground" />
        )}
        Fatturata
      </button>

      {/* Paid toggle */}
      <button
        type="button"
        onClick={togglePaid}
        disabled={isPending || !expense.is_billed}
        className="flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors disabled:opacity-50"
        style={{
          backgroundColor: expense.is_paid ? "hsl(142 76% 36% / 0.1)" : undefined,
          borderColor: expense.is_paid ? "hsl(142 76% 36%)" : undefined,
        }}
        title={
          !expense.is_billed
            ? "Prima segna come fatturata"
            : expense.is_paid
            ? "Segna come non pagata"
            : "Segna come pagata"
        }
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

// --- Property accordion section ---

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
              <Badge variant="outline" className="text-xs">
                {property.code}
              </Badge>
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
              <p className="font-semibold text-green-700">
                {formatCurrency(property.paidTotal)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Da pagare</p>
              <p className="font-semibold text-orange-700">
                {formatCurrency(property.dueTotal)}
              </p>
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
            <p className="text-sm text-muted-foreground py-2">
              Nessuna spesa registrata.
            </p>
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

// --- Main page ---

export default function AccountingOverviewPage() {
  const { data: properties, isLoading } = useAccountingProperties();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  const totals = (properties ?? []).reduce(
    (acc, p) => ({
      totalExpenses: acc.totalExpenses + p.totalExpenses,
      billedTotal: acc.billedTotal + p.billedTotal,
      paidTotal: acc.paidTotal + p.paidTotal,
      dueTotal: acc.dueTotal + p.dueTotal,
    }),
    { totalExpenses: 0, billedTotal: 0, paidTotal: 0, dueTotal: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contabilità</h1>
        <p className="text-sm text-muted-foreground">
          Riepilogo spese per immobile
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale spese</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totals.totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fatturato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totals.billedTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(totals.paidTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Da pagare</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(totals.dueTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {(!properties || properties.length === 0) ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nessun immobile trovato.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <PropertySection key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
