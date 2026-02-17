"use client";

import { useState } from "react";
import { useReopenTask } from "@/hooks/use-tasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RotateCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface TaskReopenModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskReopenModal({ taskId, isOpen, onClose }: TaskReopenModalProps) {
  const [note, setNote] = useState("");
  const reopenMutation = useReopenTask(taskId);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await reopenMutation.mutateAsync({ note });

      toast({
        variant: "success",
        title: "Task riaperta",
        description: "La task è stata riaperta. L'operatrice potrà riprendere il lavoro.",
      });

      onClose();
      setNote("");
      router.push("/manager/tasks");
    } catch (error) {
      console.error("Errore durante la riapertura:", error);

      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la riapertura della task.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Riapri Task
            </DialogTitle>
            <DialogDescription>
              Indica all&apos;operatrice cosa deve correggere. La checklist rimarrà invariata.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="reopen-note">
              Nota per l&apos;operatrice (obbligatoria, min. 5 caratteri)
            </Label>
            <Textarea
              id="reopen-note"
              placeholder="Descrivi cosa deve essere corretto o rifatto..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="mt-2"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={reopenMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={reopenMutation.isPending || note.trim().length < 5}
            >
              {reopenMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Riapertura...
                </>
              ) : (
                "Riapri task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
