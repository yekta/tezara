import { ComponentProps } from "react";

export default function LandmarkIcon(props: ComponentProps<"svg">) {
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
        d="M3 22h18M6 18v-7m4 7v-7m4 7v-7m4 7v-7m-6-9 8 5H4l8-5Z"
      />
    </svg>
  );
}
