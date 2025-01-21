import { ComponentProps } from "react";

export default function PenToolIcon(props: ComponentProps<"svg">) {
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
        d="m18 13-1.38-6.87a1 1 0 0 0-.74-.78L3.24 2.03a1 1 0 0 0-1.21 1.2l3.32 12.65a1 1 0 0 0 .78.74L13 18M2.3 2.3l7.29 7.29m6.12 11.7a1 1 0 0 1-1.42 0l-1.58-1.58a1 1 0 0 1 0-1.42l5.58-5.58a1 1 0 0 1 1.42 0l1.58 1.58a1 1 0 0 1 0 1.42l-5.58 5.58ZM13 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
      />
    </svg>
  );
}
