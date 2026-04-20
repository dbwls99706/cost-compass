import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function DivisionNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold">본부를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          존재하지 않거나 삭제된 본부입니다.
        </p>
      </div>
      <Link href="/divisions" className={buttonVariants()}>
        본부 목록으로
      </Link>
    </div>
  );
}
