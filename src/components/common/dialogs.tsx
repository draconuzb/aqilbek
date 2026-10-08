"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/constants";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "O‘chirish",
  confirmVariant = "destructive",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "default";
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2Icon className="animate-spin" />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RenameDialog({
  open,
  onOpenChange,
  initialValue,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onSave: (value: string) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suhbat nomini o‘zgartirish</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const value = String(new FormData(e.currentTarget).get("title") ?? "").trim();
            if (!value) return;
            setBusy(true);
            try {
              await onSave(value);
              onOpenChange(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input name="title" defaultValue={initialValue} maxLength={LIMITS.titleMaxChars} autoFocus className="h-10" aria-label="Yangi nom" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2Icon className="animate-spin" />} Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
