import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export default function NavigationSection({
  className,
  id,
}: {
  className?: string;
  id: number;
}) {
  const idNumber = parseInt(Number(id).toString());
  const currentThesisId = isNaN(idNumber) ? 0 : idNumber < 1 ? 0 : idNumber;
  const buttonDisabled = currentThesisId <= 1;

  return (
    <div
      className={cn(
        "w-full flex items-center justify-between gap-4",
        className
      )}
    >
      {buttonDisabled ? (
        <Button
          disabled
          size="sm"
          variant="ghost"
          className="text-muted-foreground -ml-3 min-w-0 shrink"
        >
          <ArrowLeftIcon className="size-5 -ml-1.5" />
          <p className="shrink min-w-0">Önceki Tez</p>
        </Button>
      ) : (
        <LinkButton
          href={`/thesis/${currentThesisId - 1}`}
          size="sm"
          variant="ghost"
          className="text-muted-foreground -ml-3 min-w-0 shrink"
        >
          <ArrowLeftIcon className="size-5 -ml-1.5" />
          <p className="shrink min-w-0">Önceki Tez</p>
        </LinkButton>
      )}
      <LinkButton
        href={`/thesis/${currentThesisId + 1}`}
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
