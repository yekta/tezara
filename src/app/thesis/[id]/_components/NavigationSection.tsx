"use client";

import NextPrevButton from "@/components/navigation/next-prev-button";
import { cn } from "@/components/ui/utils";
import { useUmami } from "@/lib/hooks/use-umami";
import { usePostHog } from "posthog-js/react";

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

  const umami = useUmami();
  const posthog = usePostHog();
  const sendEvent = (to: number) => {
    umami.capture("Prev/Next Thesis Button Clicked", {
      "From Thesis ID": currentThesisId,
      "To Thesis ID": to,
    });
    posthog.capture("Prev/Next Thesis Button Clicked", {
      "From Thesis ID": currentThesisId,
      "To Thesis ID": to,
    });
  };

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
        onClick={() => sendEvent(currentThesisId - 1)}
      >
        Önceki Tez
      </NextPrevButton>
      <NextPrevButton
        disabled={disabled}
        variant="next"
        href={`/thesis/${currentThesisId + 1}`}
        className="-mr-3.5"
        onClick={() => sendEvent(currentThesisId + 1)}
      >
        Sonraki Tez
      </NextPrevButton>
    </nav>
  );
}
