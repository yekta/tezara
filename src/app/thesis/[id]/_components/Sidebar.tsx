"use client";

import NextPrevButton from "@/components/navigation/next-prev-button";
import { cn } from "@/components/ui/utils";
import { usePlausible } from "@/lib/plausible";
import { useUmami } from "next-umami";

export default function Sidebar({
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

  const umami = useUmami();
  const plausible = usePlausible();
  const sendEvent = (to: number) => {
    umami.event("Prev/Next Thesis Button Clicked", {
      "From Thesis ID": currentThesisId,
      "To Thesis ID": to,
    });
    plausible("Prev/Next Thesis Button Clicked", {
      props: {
        "From Thesis ID": currentThesisId,
        "To Thesis ID": to,
      },
    });
  };

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
        href={`/thesis/${_currentThesisId + (side === "start" ? -1 : 1)}`}
        onClick={() =>
          sendEvent(_currentThesisId + (side === "start" ? -1 : 1))
        }
      >
        {side === "start" ? "Önceki Tez" : "Sonraki Tez"}
      </NextPrevButton>
    </nav>
  );
}
