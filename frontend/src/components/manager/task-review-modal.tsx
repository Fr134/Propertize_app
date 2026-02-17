"use client";

import { useState } from "react";
import { useReviewTask } from "@/hooks/use-tasks";
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
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface TaskReviewModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  mode: "approve" | "reject";
}

export function TaskReviewModal({
  taskId,
  isOpen,
  onClose,
  mode,
}: TaskReviewModalProps) {
  const [notes, setNotes] = useState("");
  const reviewMutation = useReviewTask(taskId);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await reviewMutation.mutateAsync({
        status: mode === "approve" ? "APPROVED" : "REJECTED",
        notes: notes || undefined,
      });

      toast({
        variant: "success",
        title: mode === "approve" ? "Task approvata!" : "Task rigettata",
        description: mode === "approve"
          ? "La task è stata approvata con successo."
          : "La task è stata rigettata. L'operatrice riceverà una notifica.",
      });

      onClose();
      setNotes("");
      router.push("/manager/tasks");
    } catch (error) {
      console.error("Errore durante il review:", error);

      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante il review della task.",
      });
    }
  };

  const isApprove = mode === "approve";
  const title = isApprove ? "Approva Task" : "Rigetta Task";
  const description = isApprove
    ? "Confermi di voler approvare questa task di pulizia?"
    : "Indica il motivo del rigetto della task.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isApprove ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="notes">
              {isApprove ? "Note (opzionali)" : "Motivo rigetto (obbligatorio)"}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                isApprove
                  ? "Aggiungi eventuali commenti..."
                  : "Descrivi il problema riscontrato..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2"
              required={!isApprove}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={reviewMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant={isApprove ? "default" : "destructive"}
              disabled={reviewMutation.isPending || (!isApprove && !notes.trim())}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isApprove ? "Approvazione..." : "Rigetto..."}
                </>
              ) : isApprove ? (
                "Approva"
              ) : (
                "Rigetta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
