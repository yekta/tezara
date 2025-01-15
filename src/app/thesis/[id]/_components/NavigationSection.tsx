import { LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export default function NavigationSection({
  className,
  id,
}: {
  className?: string;
  id: string;
}) {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-between gap-4",
        className
      )}
    >
      <LinkButton
        href={`/thesis/${Number(id) - 1}`}
        size="sm"
        variant="ghost"
        className="text-muted-foreground -ml-3 min-w-0 shrink"
      >
        <ArrowLeftIcon className="size-5 -ml-1.5" />
        <p className="shrink min-w-0">Önceki Tez</p>
      </LinkButton>
      <LinkButton
        href={`/thesis/${Number(id) - 1}`}
        size="sm"
        variant="ghost"
        className="text-muted-foreground -mr-3 min-w-0 shrink"
      >
        <p className="shrink min-w-0">Sonraki Tez</p>
        <ArrowRightIcon className="size-5 -mr-1.5" />
      </LinkButton>
    </div>
  );
}
