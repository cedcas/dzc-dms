"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeTaskAction } from "@/lib/actions/tasks";

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await completeTaskAction(taskId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Mark as done"
      className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/40 hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}
