"use client";

import { Download } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportProjectCostCsv } from "@/lib/actions/export";

export const ExportCsvButton = ({ projectId }: { projectId: string }) => {
  const [pending, startTransition] = useTransition();

  const download = () => {
    startTransition(async () => {
      const result = await exportProjectCostCsv(projectId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.content], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${result.filename} 다운로드`);
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={download}
      disabled={pending}
    >
      <Download className="size-4" />
      {pending ? "내보내는 중..." : "CSV 내보내기"}
    </Button>
  );
};
