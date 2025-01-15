import { cn } from "@/components/ui/utils";
import { BanIcon } from "lucide-react";
import { ComponentProps } from "react";

const defaultClassName = "size-5 shrink-0";

type TVariant = "pdf" | "csv" | "json";

export default function FileExtensionIcon({
  className,
  variant,
}: ComponentProps<"svg"> & { variant: TVariant }) {
  if (variant === "csv") {
    return (
      <svg
        className={cn(defaultClassName, className)}
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
          strokeWidth="1.5"
          d="M10.3 14.02c-.05-1-.73-1.02-1.65-1.02C7.23 13 7 13.34 7 14.67v1.66C7 17.66 7.24 18 8.65 18c.92 0 1.6-.02 1.64-1.02M21 13l-1.46 3.91c-.27.73-.41 1.09-.63 1.09-.21 0-.34-.36-.62-1.09L16.83 13m-2.1 0h-.98c-.39 0-.58 0-.74.06-.52.22-.51.73-.51 1.19 0 .46 0 .97.51 1.19.16.06.35.06.74.06s.58 0 .73.06c.53.22.52.73.52 1.19 0 .46 0 .97-.52 1.19-.15.06-.34.06-.73.06h-1.06"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M15 22h-4.27c-3.26 0-4.9 0-6.03-.8a4.1 4.1 0 0 1-.85-.8C3 19.33 3 17.8 3 14.73v-2.55c0-2.96 0-4.44.47-5.63a7.23 7.23 0 0 1 4.37-4.1C9.1 2 10.67 2 13.82 2c1.8 0 2.7 0 3.41.25a4.14 4.14 0 0 1 2.5 2.35c.27.68.27 1.53.27 3.22V10"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M3 12a3.33 3.33 0 0 1 3.33-3.33c.67 0 1.45.11 2.1-.06a1.67 1.67 0 0 0 1.18-1.18c.17-.65.06-1.43.06-2.1A3.33 3.33 0 0 1 13 2"
        />
      </svg>
    );
  }
  if (variant === "pdf") {
    return (
      <svg
        className={cn(defaultClassName, className)}
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
          strokeWidth="1.5"
          d="M7 18v-2.5m0 0V14c0-.47 0-.7.15-.85.16-.15.4-.15.9-.15h.7c.72 0 1.31.56 1.31 1.25s-.59 1.25-1.31 1.25H7ZM21 13h-1.31c-.83 0-1.24 0-1.5.24-.25.25-.25.64-.25 1.43v.83m0 0V18m0-2.5h2.18m-4.37 0c0 1.38-1.18 2.5-2.63 2.5-.32 0-.48 0-.6-.07-.3-.16-.27-.48-.27-.76v-3.34c0-.28-.03-.6.26-.76.12-.07.29-.07.62-.07a2.57 2.57 0 0 1 2.62 2.5Z"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M15 22h-4.27c-3.26 0-4.9 0-6.03-.8a4.1 4.1 0 0 1-.85-.8C3 19.33 3 17.8 3 14.73v-2.55c0-2.96 0-4.44.47-5.63a7.23 7.23 0 0 1 4.37-4.1C9.1 2 10.67 2 13.82 2c1.8 0 2.7 0 3.41.25a4.14 4.14 0 0 1 2.5 2.35c.27.68.27 1.53.27 3.22V10"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M3 12a3.33 3.33 0 0 1 3.33-3.33c.67 0 1.45.11 2.1-.06a1.67 1.67 0 0 0 1.18-1.18c.17-.65.06-1.43.06-2.1A3.33 3.33 0 0 1 13 2"
        />
      </svg>
    );
  }
  if (variant === "json") {
    return (
      <svg
        className={cn(defaultClassName, className)}
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
          strokeWidth="1.5"
          d="M9 16v-1m3 1v-1m3 1v-1M6.84 4c-.5.01-.94.1-1.3.24-.35.13-.65.36-.86.66-.19.3-.28.68-.28 1.17v3.16c0 .75-.2 1.35-.6 1.8-.4.44-1 .74-1.8.88v.13c.82.15 1.42.45 1.8.9.4.44.6 1.04.6 1.78v3.23c0 .47.1.86.28 1.15.2.3.47.53.84.66.36.14.8.22 1.32.24M17.16 4c.5.01.93.1 1.3.24.37.15.65.37.86.66.19.3.28.68.28 1.17v3.16c0 .75.2 1.35.6 1.8.4.44 1 .74 1.8.88v.13c-.82.15-1.42.45-1.8.9-.4.44-.6 1.04-.6 1.78v3.23c0 .47-.1.86-.28 1.15-.2.3-.47.53-.84.66-.36.14-.8.22-1.32.24"
        />
      </svg>
    );
  }
  return <BanIcon className={cn(defaultClassName, className)} />;
}
