"use client";

import BackButton from "@/components/navigation/back-button";
import { useNavigationHistory } from "@/components/providers/navigation-history-provider";
import { cn } from "@/components/ui/utils";

type Props = {
  className?: string;
};

export default function GoBackBar({ className }: Props) {
  const { previousPath } = useNavigationHistory();
  return (
    previousPath && (
      <div className={cn("w-full flex items-center justify-center", className)}>
        {previousPath && <BackButton href={previousPath} />}
      </div>
    )
  );
}
