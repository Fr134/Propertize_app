"use client";

import { useState } from "react";
import {
  useExternalContacts,
  useCreateExternalContact,
  useUpdateExternalContact,
  useDeleteExternalContact,
} from "@/hooks/use-external-contacts";
import type { ExternalContact } from "@/hooks/use-external-contacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, ContactRound } from "lucide-react";

const CATEGORIES: Record<string, string> = {
  PLUMBER: "Idraulico",
  ELECTRICIAN: "Elettricista",
  CLEANER: "Pulizie",
  HANDYMAN: "Tuttofare",
  INSPECTOR: "Ispettore",
  OTHER: "Altro",
};

const CATEGORY_LIST = Object.entries(CATEGORIES).map(([value, label]) => ({
  value,
  label,
}));

export default function ContactsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const { data: contacts, isLoading } = useExternalContacts(
    categoryFilter || undefined
  );
  const createContact = useCreateExternalContact();
  const updateContact = useUpdateExternalContact();
  const deleteContact = useDeleteExternalContact();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalContact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("OTHER");

  function openCreate() {
    setEditing(null);
    setName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setCategory("OTHER");
    setSheetOpen(true);
  }

  function openEdit(contact: ExternalContact) {
    setEditing(contact);
    setName(contact.name);
    setPhone(contact.phone ?? "");
    setEmail(contact.email ?? "");
    setCompany(contact.company ?? "");
    setCategory(contact.category);
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    const data = {
      name,
      phone,
      email,
      company,
      category: category as "PLUMBER" | "ELECTRICIAN" | "CLEANER" | "HANDYMAN" | "INSPECTOR" | "OTHER",
    };
    if (editing) {
      await updateContact.mutateAsync({ id: editing.id, data });
    } else {
      await createContact.mutateAsync(data);
    }
    setSheetOpen(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteContact.mutateAsync(deleteId);
    setDeleteId(null);
  }

  const isSaving = createContact.isPending || updateContact.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contatti esterni</h1>
        <div className="flex items-center gap-2">
          <Select
            value={categoryFilter || "ALL"}
            onValueChange={(v) => setCategoryFilter(v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Tutte le categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutte le categorie</SelectItem>
              {CATEGORY_LIST.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo contatto
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !contacts?.length ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <ContactRound className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nessun contatto esterno. Crea il primo contatto per iniziare.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.company ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CATEGORIES[contact.category] ?? contact.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />{contact.phone}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {contact.email ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />{contact.email}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(contact)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(contact.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editing ? "Modifica contatto" : "Nuovo contatto esterno"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Azienda</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LIST.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
            >
              {isSaving
                ? "Salvataggio..."
                : editing
                ? "Salva modifiche"
                : "Crea contatto"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disattiva contatto</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler disattivare questo contatto? Non sarà più
              disponibile per nuovi task.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              disabled={deleteContact.isPending}
              onClick={handleDelete}
            >
              {deleteContact.isPending ? "Disattivazione..." : "Disattiva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
