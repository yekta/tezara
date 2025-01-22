import GoBackBar from "@/app/thesis/[id]/go-back-bar";
import NextPrevButton from "@/components/navigation/next-prev-button";
import { cn } from "@/components/ui/utils";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function Layout({ params, children }: Props) {
  const { id } = await params;
  const idNumber = parseInt(Number(id).toString());

  return (
    <div className="w-full flex flex-col items-center flex-1">
      <GoBackBar buttonText="Geri Dön" className="-mb-3 md:mb-0" />
      <div className="w-full pt-4 flex-1 relative flex flex-col md:flex-row md:justify-center px-5 md:px-3 lg:px-5">
        {/* Md left */}
        <Sidebar
          currentThesisId={idNumber}
          side="start"
          className="pr-4 lg:pr-6 pt-0.5 hidden md:flex"
        />
        {children}
        {/* Md right */}
        <Sidebar
          currentThesisId={idNumber}
          side="end"
          className="pl-4 md:pl-6 pt-0.5 hidden md:flex"
        />
      </div>
    </div>
  );
}

function Sidebar({
  className,
  currentThesisId,
  side,
}: {
  className?: string;
  currentThesisId: number;
  side: "start" | "end";
}) {
  const idNumber = parseInt(Number(currentThesisId).toString());
  const _currentThesisId = isNaN(idNumber) ? 0 : idNumber < 1 ? 0 : idNumber;
  const disabled = side === "start" ? _currentThesisId <= 1 : false;

  return (
    <nav
      data-side={side}
      className={cn(
        "shrink-0 max-w-48 flex flex-col sticky top-14 h-[calc(100svh-6rem)]",
        className
      )}
    >
      <NextPrevButton
        disabled={disabled}
        variant={side === "start" ? "prev" : "next"}
        href={
          side === "start"
            ? `/thesis/${_currentThesisId - 1}`
            : `/thesis/${_currentThesisId + 1}`
        }
      >
        {side === "start" ? "Önceki Tez" : "Sonraki Tez"}
      </NextPrevButton>
    </nav>
  );
}
