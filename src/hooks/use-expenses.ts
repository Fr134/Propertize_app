import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { CreateExpenseInput } from "@/lib/validators";

// --- Types ---

interface ExpenseAuthor {
  id: string;
  first_name: string;
  last_name: string;
}

interface ExpensePhoto {
  id: string;
  expense_id: string;
  photo_url: string;
  uploaded_at: string;
}

interface Expense {
  id: string;
  property_id: string;
  created_by: string;
  description: string;
  amount: string; // Decimal comes as string from Prisma JSON
  vat_amount: string | null;
  expense_date: string;
  is_billed: boolean;
  billed_at: string | null;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  author: ExpenseAuthor;
  photos: ExpensePhoto[];
}

interface AccountingProperty {
  id: string;
  name: string;
  code: string;
  address: string;
  expenseCount: number;
  totalExpenses: number;
  billedTotal: number;
  paidTotal: number;
  dueTotal: number;
}

// --- Hooks ---

export function useExpenses(propertyId: string) {
  return useQuery({
    queryKey: ["expenses", propertyId],
    queryFn: () =>
      fetchJson<Expense[]>(`/api/properties/${propertyId}/expenses`),
    enabled: !!propertyId,
  });
}

export function useAccountingProperties() {
  return useQuery({
    queryKey: ["accounting", "properties"],
    queryFn: () =>
      fetchJson<AccountingProperty[]>("/api/accounting/properties"),
  });
}

export function useCreateExpense(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseInput) =>
      fetchJson(`/api/properties/${propertyId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["accounting"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: { is_billed?: boolean; is_paid?: boolean };
    }) =>
      fetchJson(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["accounting"] });
    },
  });
}

export function useSaveExpensePhoto(expenseId: string, propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoUrl: string) =>
      fetchJson(`/api/expenses/${expenseId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", propertyId] });
    },
  });
}

export type { Expense, ExpensePhoto, AccountingProperty };
