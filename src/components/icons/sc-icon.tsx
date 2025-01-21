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
