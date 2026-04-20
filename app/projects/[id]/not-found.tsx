import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold">프로젝트를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          삭제되었거나 존재하지 않는 프로젝트입니다.
        </p>
      </div>
      <Link href="/projects" className={buttonVariants()}>
        프로젝트 목록으로
      </Link>
    </div>
  );
}
