import { TScOption } from "@/lib/constants";
import { cn } from "@/components/ui/utils";
import { BanIcon, MailIcon } from "lucide-react";
import { ComponentProps } from "react";

export default function ScIcon({
  slug,
  className,
}: ComponentProps<"svg"> & { slug: TScOption }) {
  const defaultClassName = "size-6";

  if (slug === "github") {
    return (
      <svg
        aria-label="GitHub Icon"
        className={cn(defaultClassName, className)}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.001 2C6.475 1.998 2 6.593 2 12.264c0 4.485 2.8 8.297 6.699 9.697.525.135.444-.248.444-.51v-1.778c-3.032.365-3.155-1.696-3.358-2.04-.411-.721-1.383-.905-1.093-1.25.69-.364 1.395.093 2.21 1.33.59.897 1.74.746 2.324.596.127-.539.4-1.021.775-1.395-3.141-.578-4.45-2.548-4.45-4.889 0-1.136.364-2.18 1.079-3.022-.456-1.389.042-2.578.11-2.755 1.297-.119 2.647.955 2.752 1.04.737-.204 1.58-.312 2.522-.312.948 0 1.793.112 2.537.319.252-.197 1.503-1.12 2.71-1.008.065.177.552 1.338.123 2.709.724.844 1.092 1.898 1.092 3.036 0 2.346-1.318 4.317-4.468 4.887.27.272.484.597.63.956.146.358.221.743.22 1.132v2.582c.019.207 0 .411.336.411C19.151 20.63 22 16.79 22 12.266 22 6.593 17.522 2 12.001 2Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (slug === "x") {
    return (
      <svg
        aria-label="X (Twitter) Icon"
        className={cn(defaultClassName, className)}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.18 3.86h2.76l-6.03 6.9L21 20.14h-5.55l-4.35-5.7-4.98 5.7H3.36l6.45-7.38L3 3.86h5.7l3.93 5.2 4.55-5.2Zm-.97 14.62h1.53L7.86 5.43H6.22l9.99 13.05Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (slug === "buymeacoffee") {
    return (
      <svg
        aria-label="Buy Me A Coffee Icon"
        className={cn(defaultClassName, className)}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          fill="#FD0"
          d="M12.48 11.25c-.71.3-1.53.66-2.58.66a4.9 4.9 0 0 1-1.31-.18l.73 7.5a1.25 1.25 0 0 0 1.25 1.14s1.03.05 1.38.05c.37 0 1.48-.05 1.48-.05a1.25 1.25 0 0 0 1.25-1.15l.78-8.28c-.35-.12-.7-.2-1.1-.2-.68 0-1.24.24-1.88.51Z"
        />
        <path
          fill="currentColor"
          d="m18.84 7.36-.11-.55c-.1-.5-.32-.97-.83-1.15-.17-.06-.35-.08-.48-.2-.12-.12-.16-.3-.2-.48-.09-.56-.1-1.25-.36-1.76-.16-.34-.5-.53-.83-.66-.97-.36-2.05-.45-3.08-.5-1.72-.1-3.72-.14-5.37.46-.55.2-1.28.7-.88 1.37.28.5.99.68 1.5.79.9.2 1.83.28 2.74.3 1.26.06 2.54 0 3.79-.19.29-.04.48-.43.39-.7-.1-.31-.38-.44-.7-.39-.86.14-1.75.17-2.63.17-1.08 0-2.18-.04-3.24-.27a.1.1 0 0 1-.07-.09c0-.03.03-.08.08-.08a15.7 15.7 0 0 1 6.4 0c.33.07.75.1.9.45.2.5.24 1.08.36 1.6.02.1-.06.23-.17.23a26.48 26.48 0 0 1-4.04.26c-1.18 0-2.36-.07-3.53-.2-.52-.07-1.03-.15-1.54-.24-.6-.1-1.22.16-1.5.72-.13.26-.16.55-.22.83-.06.29-.15.6-.11.88a1.4 1.4 0 0 0 1.14 1.25c3.1.57 6.3.66 9.44.32a.4.4 0 0 1 .44.44l-.9 8.82c-.04.34-.04.7-.1 1.03-.1.53-.47.86-.99.98-1.03.23-2.06.15-3.1.15-.58 0-1.3-.05-1.74-.48-.4-.38-.45-.98-.5-1.5-.3-2.8-.6-5.6-.88-8.4-.03-.3-.24-.59-.57-.57-.28.01-.6.25-.56.56.33 3.14.63 6.27.98 9.4.12 1.13.98 1.73 2.04 1.9.61.1 1.25.12 1.87.13.8.01 1.62.04 2.41-.1 1.17-.22 2.05-1 2.18-2.22L17.3 9.62a.41.41 0 0 1 .32-.36c.34-.06.66-.17.9-.43.38-.4.45-.93.32-1.47Zm-1.71.84c-2.01.3-4.05.45-6.09.38-1.45-.05-2.89-.21-4.33-.41-.55-.08-.53-.5-.44-.98.05-.22.13-.5.39-.54.4-.05.87.12 1.27.18 2.9.45 5.9.4 8.79-.11.33-.06.7-.17.9.17.13.23.15.55.13.81-.02.33-.34.46-.62.5Z"
        />
      </svg>
    );
  }
  if (slug === "discord") {
    return (
      <svg
        aria-label="Discord Icon"
        className={cn(defaultClassName, className)}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18.942 5.297A16.29 16.29 0 0 0 14.816 4a12.09 12.09 0 0 0-.529 1.097 15.153 15.153 0 0 0-4.573 0A11.724 11.724 0 0 0 9.18 4 16.235 16.235 0 0 0 5.05 5.3C2.44 9.246 1.731 13.094 2.085 16.887a16.5 16.5 0 0 0 5.06 2.593c.41-.564.773-1.16 1.084-1.785a10.66 10.66 0 0 1-1.706-.83c.142-.106.282-.217.418-.331 3.29 1.539 6.866 1.539 10.118 0 .136.114.276.224.418.33-.544.329-1.116.607-1.71.833.314.627.675 1.224 1.084 1.785a16.461 16.461 0 0 0 5.064-2.595c.415-4.397-.71-8.21-2.973-11.59ZM8.678 14.554c-.988 0-1.798-.922-1.798-2.045 0-1.123.792-2.047 1.798-2.047 1.005 0 1.815.922 1.798 2.047.001 1.123-.793 2.045-1.798 2.045Zm6.644 0c-.988 0-1.798-.922-1.798-2.045 0-1.123.793-2.047 1.798-2.047 1.006 0 1.816.922 1.798 2.047 0 1.123-.793 2.045-1.798 2.045Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (slug === "email") {
    return (
      <MailIcon
        aria-label="Email Icon"
        className={cn(defaultClassName, "p-0.25", className)}
      />
    );
  }
  return <BanIcon className={cn(defaultClassName, className)} />;
}
