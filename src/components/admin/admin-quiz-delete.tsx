"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteQuiz } from "@/app/actions/admin";
import { ConfirmDialog } from "@/components/common/dialogs";
import { Button } from "@/components/ui/button";

export function AdminQuizDelete({ quizId }: { quizId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Testni o‘chirish" onClick={() => setOpen(true)}>
        <Trash2Icon />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Testni o‘chirasizmi?"
        description="Test va unga oid barcha urinishlar o‘chiriladi."
        onConfirm={async () => {
          const result = await adminDeleteQuiz(quizId);
          if (result.ok) toast.success("Test o‘chirildi");
          else toast.error(result.error);
        }}
      />
    </>
  );
}
