"use client";

import BackButton from "@/app/theses/[id]/go-back-button";
import { cn } from "@/components/ui/utils";
import { routeHistoryAtom } from "@/lib/store/main";
import { useAtomValue } from "jotai";

export type TGoBackBarProps = {
  buttonText: string;
  className?: string;
  defaultPath: string;
};

export default function GoBackBar({
  buttonText,
  className,
  defaultPath,
}: TGoBackBarProps) {
  const routeHistory = useAtomValue(routeHistoryAtom);

  return (
    <div className={cn("w-full flex items-center justify-center", className)}>
      <BackButton
        buttonText={buttonText}
        href={
          routeHistory.length > 0
            ? routeHistory[routeHistory.length - 1]
            : defaultPath
        }
      />
    </div>
  );
}
