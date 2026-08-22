import { ComponentProps } from "react";

export default function GraduationCapIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M22 10v6M6 12.5V16c0 .8.63 1.56 1.76 2.12 1.12.56 2.65.88 4.24.88 1.6 0 3.12-.32 4.24-.88C17.37 17.56 18 16.8 18 16v-3.5m3.42-1.58a1 1 0 0 0-.02-1.84l-8.57-3.9a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0l8.59-3.9Z"
      />
    </svg>
  );
}
