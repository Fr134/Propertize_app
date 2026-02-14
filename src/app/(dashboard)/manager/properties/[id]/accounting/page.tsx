"use client";

import { use } from "react";
import Link from "next/link";
import { useProperty } from "@/hooks/use-properties";
import { useExpenses } from "@/hooks/use-expenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Receipt, Camera } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

export default function AccountingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: property, isLoading: loadingProperty } = useProperty(id);
  const { data: expenses, isLoading: loadingExpenses } = useExpenses(id);

  if (loadingProperty || loadingExpenses) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  if (!property) {
    return <p className="text-sm text-destructive">Immobile non trovato.</p>;
  }

  const totalAmount = (expenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const totalVat = (expenses ?? []).reduce(
    (sum, e) => sum + Number(e.vat_amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/manager/properties/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Contabilità — {property.name}
          </h1>
          <p className="text-sm text-muted-foreground">{property.code}</p>
        </div>
        <Button asChild>
          <Link href={`/manager/properties/${id}/accounting/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Nuova spesa
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale spese</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale IVA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalVat)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">N. movimenti</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{expenses?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {(!expenses || expenses.length === 0) ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nessuna spesa registrata per questo immobile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {expense.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(expense.expense_date)} — {expense.author.first_name}{" "}
                    {expense.author.last_name}
                  </p>
                  {expense.photos.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {expense.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={photo.photo_url}
                            alt="Allegato spesa"
                            className="h-12 w-12 rounded object-cover border"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">
                    {formatCurrency(expense.amount)}
                  </p>
                  {expense.vat_amount && (
                    <p className="text-xs text-muted-foreground">
                      IVA {formatCurrency(expense.vat_amount)}
                    </p>
                  )}
                  {expense.photos.length > 0 && (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Camera className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {expense.photos.length}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
