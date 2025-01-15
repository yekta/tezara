import NavigationSection from "@/app/thesis/[id]/_components/NavigationSection";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function Layout({ params, children }: Props) {
  const { id } = await params;
  return (
    <div className="w-full flex-1 relative flex flex-col md:flex-row md:justify-center text-lg px-5 md:px-3 lg:px-5">
      <NavigationSection id={id} className="md:hidden pb-4" />
      {/* Md left */}
      <Sidebar
        currentThesisId={Number(id)}
        side="start"
        className="pr-4 lg:pr-6 pt-0.5 hidden md:flex"
      />
      {children}
      {/* Md right */}
      <Sidebar
        currentThesisId={Number(id)}
        side="end"
        className="pl-4 md:pl-6 pt-0.5 hidden md:flex"
      />
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
  return (
    <div
      data-side={side}
      className={cn(
        "shrink-0 max-w-48 flex flex-col sticky top-14 h-[calc(100svh-6rem)]",
        className
      )}
    >
      <LinkButton
        href={
          side === "start"
            ? `/thesis/${currentThesisId - 1}`
            : `/thesis/${currentThesisId + 1}`
        }
        size="sm"
        variant="ghost"
        className="text-muted-foreground min-w-0 shrink"
      >
        {side === "start" && <ArrowLeftIcon className="size-5 -ml-1.5" />}
        <p className="shrink min-w-0">
          {side === "start" ? "Önceki Tez" : "Sonraki Tez"}
        </p>
        {side === "end" && <ArrowRightIcon className="size-5 -mr-1.5" />}
      </LinkButton>
    </div>
  );
}
