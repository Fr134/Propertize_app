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
  created_at: string;
  author: ExpenseAuthor;
  photos: ExpensePhoto[];
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

export type { Expense, ExpensePhoto };
