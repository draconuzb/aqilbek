"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteQuiz } from "@/app/actions/quizzes";
import { ConfirmDialog } from "@/components/common/dialogs";
import { Button } from "@/components/ui/button";

export function QuizCardActions({ quizId }: { quizId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Testni o‘chirish" onClick={() => setOpen(true)} className="text-muted-foreground">
        <Trash2Icon />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Testni o‘chirasizmi?"
        description="Test va uning barcha natijalari o‘chiriladi."
        onConfirm={async () => {
          const result = await deleteQuiz(quizId);
          if (result.ok) toast.success("Test o‘chirildi");
          else toast.error(result.error);
        }}
      />
    </>
  );
}
