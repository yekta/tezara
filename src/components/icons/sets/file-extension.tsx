import { BanIcon } from "lucide-react";
import { ComponentProps } from "react";

type TVariant = "pdf" | "pdf-x" | "csv" | "json";

export default function FileExtensionIcon({
  variant,
  ...rest
}: ComponentProps<"svg"> & { variant: TVariant }) {
  if (variant === "csv") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        {...rest}
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M10.3 14.02c-.05-1-.73-1.02-1.65-1.02C7.23 13 7 13.34 7 14.67v1.66C7 17.66 7.24 18 8.65 18c.92 0 1.6-.02 1.64-1.02M21 13l-1.46 3.91c-.27.73-.41 1.09-.63 1.09-.21 0-.34-.36-.62-1.09L16.83 13m-2.1 0h-.98c-.39 0-.58 0-.74.06-.52.22-.51.73-.51 1.19 0 .46 0 .97.51 1.19.16.06.35.06.74.06s.58 0 .73.06c.53.22.52.73.52 1.19 0 .46 0 .97-.52 1.19-.15.06-.34.06-.73.06h-1.06M15 22h-4.27c-3.26 0-4.9 0-6.03-.8a4.1 4.1 0 0 1-.85-.8C3 19.33 3 17.8 3 14.73v-2.55c0-2.96 0-4.44.47-5.63a7.23 7.23 0 0 1 4.37-4.1C9.1 2 10.67 2 13.82 2c1.8 0 2.7 0 3.41.25a4.14 4.14 0 0 1 2.5 2.35c.27.68.27 1.53.27 3.22V10M3 12a3.33 3.33 0 0 1 3.33-3.33c.67 0 1.45.11 2.1-.06a1.67 1.67 0 0 0 1.18-1.18c.17-.65.06-1.43.06-2.1A3.33 3.33 0 0 1 13 2"
        />
      </svg>
    );
  }
  if (variant === "pdf-x") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        {...rest}
      >
        <path
          fill="currentColor"
          d="M6.25 18a.75.75 0 0 0 1.5 0h-1.5Zm.9-4.85-.51-.55.51.55Zm13.85.6a.75.75 0 0 0 0-1.5v1.5ZM17.19 18a.75.75 0 0 0 1.5 0h-1.5Zm2.93-1.75a.75.75 0 0 0 0-1.5v1.5Zm-7.6 1.68-.37.66.36-.66Zm0-4.86.35.65-.36-.65ZM15 22.75a.75.75 0 0 0 0-1.5v1.5ZM4.7 21.2l.44-.61-.44.61Zm-.85-.8.59-.47-.6.47ZM3.47 6.55l.7.28-.7-.28Zm4.37-4.1-.25-.72.25.71ZM13 2v.75a.75.75 0 0 0 0-1.5V2ZM2.25 12a.75.75 0 0 0 1.5 0h-1.5Zm4.08-3.33v-.75.75Zm2.1-.06.2.72-.2-.72Zm1.18-1.18.72.2-.72-.2Zm.06-2.1h-.75.75Zm6.86-3.86a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm3.94 6.06a.75.75 0 1 0 1.06-1.06l-1.06 1.06Zm-5-1.06a.75.75 0 0 0 1.06 1.06l-1.06-1.06Zm6.06-3.94a.75.75 0 0 0-1.06-1.06l1.06 1.06ZM7.75 18v-2.5h-1.5V18h1.5Zm0-2.5V14h-1.5v1.5h1.5Zm0-1.5a11.68 11.68 0 0 1 .01-.44v.01a.36.36 0 0 1-.09.12L6.64 12.6c-.25.24-.33.52-.36.75-.03.2-.03.44-.03.65h1.5Zm-.08-.31c-.09.08-.17.08-.1.07h.17l.31-.01v-1.5c-.23 0-.47 0-.67.02-.22.03-.5.1-.74.33l1.03 1.09Zm.38.06h.7v-1.5h-.7v1.5Zm.7 0c.35 0 .56.26.56.5h1.5c0-1.14-.96-2-2.06-2v1.5Zm.56.5c0 .24-.21.5-.56.5v1.5c1.1 0 2.06-.86 2.06-2h-1.5Zm-.56.5H7v1.5h1.75v-1.5ZM21 12.25h-1.31v1.5H21v-1.5Zm-1.31 0c-.4 0-.76 0-1.06.04-.31.04-.66.13-.95.41l1.03 1.09c-.03.03-.05 0 .11-.02.18-.02.44-.02.87-.02v-1.5Zm-2.01.45c-.3.28-.4.63-.45.95-.04.29-.04.65-.04 1.02h1.5c0-.42 0-.65.02-.81.02-.14.04-.11 0-.07l-1.03-1.09Zm-.5 1.97v.83h1.5v-.83h-1.5Zm1.5 3.33v-2.5h-1.5V18h1.5Zm-.74-1.75h2.18v-1.5h-2.18v1.5ZM15 15.5c0 .93-.8 1.75-1.88 1.75v1.5a3.31 3.31 0 0 0 3.38-3.25H15Zm-1.88 1.75h-.31l.06.02-.72 1.32c.2.1.38.14.53.15l.45.01v-1.5Zm-.25.03a.3.3 0 0 1 .1.09l.04.07-.01-.08v-.19h-1.5c0 .08-.01.35.04.58.06.3.23.63.61.84l.72-1.31Zm.13-.11v-3.34h-1.5v3.34H13Zm0-3.34v-.1a2.56 2.56 0 0 1 0-.17s0 .03-.03.07a.32.32 0 0 1-.1.1l-.72-1.32c-.38.21-.55.55-.61.84-.05.24-.04.5-.04.58H13Zm-.13-.1c-.07.03-.11.03-.06.03h.11l.2-.01v-1.5l-.44.01a1.3 1.3 0 0 0-.53.15l.72 1.31Zm.26.02c1.07 0 1.87.82 1.87 1.75h1.5a3.31 3.31 0 0 0-3.38-3.25v1.5Zm1.87 7.5h-4.27v1.5H15v-1.5Zm-4.27 0c-1.65 0-2.83 0-3.74-.1-.9-.09-1.44-.27-1.85-.56l-.87 1.23c.72.5 1.55.72 2.57.83 1 .1 2.27.1 3.89.1v-1.5Zm-5.6-.66c-.26-.19-.5-.4-.7-.66l-1.17.93c.3.37.63.69 1.01.96l.86-1.23Zm-.7-.66c-.3-.38-.48-.88-.58-1.7-.1-.85-.1-1.95-.1-3.5h-1.5c0 1.51 0 2.72.11 3.67.12.97.36 1.78.9 2.46l1.17-.93Zm-.68-5.2v-2.55h-1.5v2.55h1.5Zm0-2.55c0-1.49 0-2.57.06-3.43.05-.85.16-1.43.36-1.92l-1.4-.55c-.27.7-.4 1.45-.46 2.37-.06.92-.06 2.06-.06 3.53h1.5Zm.42-5.35a6.48 6.48 0 0 1 3.92-3.68l-.5-1.42a7.98 7.98 0 0 0-4.82 4.55l1.4.55Zm3.92-3.68c1-.35 2.25-.4 4.91-.4v-1.5c-2.57 0-4.12.03-5.4.48l.49 1.42ZM3.75 12c0-.69.27-1.34.76-1.83L3.45 9.11c-.77.77-1.2 1.8-1.2 2.89h1.5Zm.76-1.83a2.58 2.58 0 0 1 1.82-.75v-1.5c-1.08 0-2.12.43-2.88 1.2l1.06 1.05Zm1.82-.75.49.01.55.02c.38.01.83 0 1.25-.12L8.24 7.9c-.22.05-.5.07-.84.06-.16 0-.33 0-.51-.02l-.56-.01v1.5Zm2.3-.09c.4-.1.78-.32 1.08-.62L8.65 7.65a.92.92 0 0 1-.41.24l.39 1.44Zm1.08-.62c.3-.3.51-.68.62-1.09L8.9 7.24a.92.92 0 0 1-.24.4L9.7 8.72Zm.62-1.09c.12-.42.13-.87.12-1.25l-.02-.55-.01-.49h-1.5l.01.55.02.52c.01.34 0 .62-.06.84l1.44.38Zm.09-2.29c0-.68.27-1.34.75-1.82l-1.06-1.06c-.76.76-1.2 1.8-1.2 2.88h1.5Zm.75-1.82A2.58 2.58 0 0 1 13 2.75v-1.5c-1.08 0-2.12.43-2.89 1.2l1.06 1.06Zm4.3-.98 2.5 2.5 1.06-1.06-2.5-2.5-1.06 1.06Zm2.5 2.5 2.5 2.5 1.06-1.06-2.5-2.5-1.06 1.06Zm-1.44 2.5 2.5-2.5-1.06-1.06-2.5 2.5 1.06 1.06Zm2.5-2.5 2.5-2.5-1.06-1.06-2.5 2.5 1.06 1.06Z"
        />
      </svg>
    );
  }
  if (variant === "pdf") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        {...rest}
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M7 18v-2.5m0 0V14c0-.47 0-.7.15-.85.16-.15.4-.15.9-.15h.7c.72 0 1.31.56 1.31 1.25s-.59 1.25-1.31 1.25H7ZM21 13h-1.31c-.83 0-1.24 0-1.5.24-.25.25-.25.64-.25 1.43v.83m0 0V18m0-2.5h2.18M15 22h-4.27c-3.26 0-4.9 0-6.03-.8a4.1 4.1 0 0 1-.85-.8C3 19.33 3 17.8 3 14.73v-2.55c0-2.96 0-4.44.47-5.63a7.23 7.23 0 0 1 4.37-4.1C9.1 2 10.67 2 13.82 2c1.8 0 2.7 0 3.41.25a4.14 4.14 0 0 1 2.5 2.35c.27.68.27 1.53.27 3.22V10M3 12a3.33 3.33 0 0 1 3.33-3.33c.67 0 1.45.11 2.1-.06a1.67 1.67 0 0 0 1.18-1.18c.17-.65.06-1.43.06-2.1A3.33 3.33 0 0 1 13 2m2.75 13.5c0 1.38-1.18 2.5-2.63 2.5-.32 0-.48 0-.6-.07-.3-.16-.27-.48-.27-.76v-3.34c0-.28-.03-.6.26-.76.12-.07.29-.07.62-.07a2.57 2.57 0 0 1 2.62 2.5Z"
        />
      </svg>
    );
  }
  if (variant === "json") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        {...rest}
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
  return <BanIcon {...rest} />;
}
