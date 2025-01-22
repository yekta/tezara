import NextPrevButton from "@/components/navigation/next-prev-button";
import { cn } from "@/components/ui/utils";

export default function NavigationSection({
  className,
  id,
}: {
  className?: string;
  id: number;
}) {
  const idNumber = parseInt(Number(id).toString());
  const currentThesisId = isNaN(idNumber) ? 0 : idNumber < 1 ? 0 : idNumber;
  const disabled = currentThesisId <= 1;

  return (
    <nav
      className={cn(
        "w-full flex items-center justify-between gap-4",
        className
      )}
    >
      <NextPrevButton
        disabled={disabled}
        variant="prev"
        href={`/thesis/${currentThesisId - 1}`}
        className="-ml-3.5"
      >
        Önceki Tez
      </NextPrevButton>
      <NextPrevButton
        disabled={disabled}
        variant="next"
        href={`/thesis/${currentThesisId + 1}`}
        className="-mr-3.5"
      >
        Sonraki Tez
      </NextPrevButton>
    </nav>
  );
}
