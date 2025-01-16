import { cn } from "@/components/ui/utils";
import { ComponentProps } from "react";

export default function BroomIcon({ className }: ComponentProps<"svg">) {
  return (
    <svg
      className={cn("size-5 shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m23 1-6 6m0 0c-2.67-2.67-5.33-3-8-1m8 1c2.67 2.67 3 5.33 1 8M9 6l-8 6 3 3 3-1-1 3 6 6 6-8M9 6l9 9"
      />
    </svg>
  );
}
