import { ComponentProps } from "react";

export default function TestTubeDiagonalIcon(props: ComponentProps<"svg">) {
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
        d="M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-4.01L17 3m-1-1 6 6m-10 8H4"
      />
    </svg>
  );
}
