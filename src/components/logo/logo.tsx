import { cn } from "@/components/ui/utils";
import { ComponentProps } from "react";

export default function Logo({ className }: ComponentProps<"svg"> & {}) {
  return (
    <svg
      className={cn("shrink-0 size-5", className)}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2 3a3 3 0 0 1 3-3h9.33a2 2 0 0 1 1.43.6l7.67 7.85a2 2 0 0 1 .57 1.4V21a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1a1 1 0 1 1 2 0v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V10.44h-5.25a3 3 0 0 1-3-3V2H5a1 1 0 0 0-1 1v1a1 1 0 0 1-2 0V3Zm13.75.45 4.87 4.99h-3.87a1 1 0 0 1-1-1V3.45Zm-6.58 11.3a5 5 0 1 0-1.41 1.41l2.53 2.55a1 1 0 0 0 1.42-1.42l-2.54-2.53ZM8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
