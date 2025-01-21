import { ComponentProps } from "react";

export default function GlobeIcon(props: ComponentProps<"svg">) {
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
        d="M22 12a10 10 0 0 1-10 10m10-10A10 10 0 0 0 12 2m10 10H2m10 10A10 10 0 0 1 2 12m10 10a14.5 14.5 0 0 1 0-20m0 20a14.5 14.5 0 0 0 0-20M2 12A10 10 0 0 1 12 2"
      />
    </svg>
  );
}
