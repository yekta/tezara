"use client";

import { availableThemes, TTheme } from "@/components/providers/themes";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MonitorSmartphoneIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeButton({
  type = "default",
}: {
  type?: "default" | "dropdown-menu-item";
}) {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    const newThemeIndex =
      (availableThemes.indexOf(theme as TTheme) + 1) % availableThemes.length;
    setTheme(availableThemes[newThemeIndex]);
  };
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setMounted(true);
  }, []);

  const themeText = !mounted
    ? "Light"
    : theme === "system"
    ? "System"
    : theme === "dark"
    ? "Dark"
    : "Light";

  const Icon = !mounted
    ? SunIcon
    : theme === "system"
    ? MonitorSmartphoneIcon
    : theme === "dark"
    ? MoonIcon
    : SunIcon;

  if (type === "dropdown-menu-item") {
    return (
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          toggleTheme();
        }}
        className="w-full flex items-center justify-start gap-2.5 text-left leading-tight cursor-pointer"
      >
        <Icon
          suppressHydrationWarning
          className="size-5 shrink-0 -ml-0.5 -my-1"
        />
        <div className="shrink min-w-0 flex flex-col gap-0.25 -mt-0.25">
          <p className="text-xs text-muted-foreground font-medium leading-tight">
            Theme
          </p>
          <p suppressHydrationWarning className="shrink min-w-0 leading-tight">
            {themeText}
          </p>
        </div>
      </DropdownMenuItem>
    );
  }

  return (
    <Button
      aria-label="Toggle Theme"
      className="p-1.5 rounded-lg"
      variant="outline"
      onClick={toggleTheme}
    >
      <Icon suppressHydrationWarning className="size-5" />
    </Button>
  );
}
