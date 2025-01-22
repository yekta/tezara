"use client";

import { cn } from "@/components/ui/utils";
import { previousPathForThesisPageAtom } from "@/lib/store/main";
import { useAtomValue } from "jotai";
import { Suspense } from "react";
import { useHydrateAtoms } from "jotai/utils";
import BackButton from "@/app/thesis/[id]/go-back-button";

export type TGoBackBarProps = {
  buttonText: string;
  className?: string;
};

export default function GoBackBar({ buttonText, className }: TGoBackBarProps) {
  useHydrateAtoms([[previousPathForThesisPageAtom, null]]);
  return (
    <Suspense fallback="Loading...">
      <GoBackBarInner buttonText={buttonText} className={className} />
    </Suspense>
  );
}

function GoBackBarInner({ buttonText, className }: TGoBackBarProps) {
  const previousPath = useAtomValue(previousPathForThesisPageAtom);

  return (
    previousPath && (
      <div className={cn("w-full flex items-center justify-center", className)}>
        {previousPath && (
          <BackButton buttonText={buttonText} href={previousPath} />
        )}
      </div>
    )
  );
}
