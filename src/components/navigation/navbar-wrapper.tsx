"use client";

import { NavigationMenu } from "@/components/ui/navigation-menu";
import { cn } from "@/components/ui/utils";
import { useWindowScroll } from "@uidotdev/usehooks";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function NavbarWrapper({ className, children }: Props) {
  const [{ y }] = useWindowScroll();
  return (
    <NavigationMenu
      data-not-at-top={y ? (y > 5 ? true : undefined) : undefined}
      className={cn(
        "w-full fixed left-0 top-0 z-50 flex items-center justify-between p-1.5 md:p-2 gap-2.5 bg-background border-b transition border-b-border/0 data-[not-at-top]:border-b-border shadow-navbar shadow-shadow/0 data-[not-at-top]:shadow-shadow/[var(--opacity-shadow)]",
        className
      )}
    >
      {children}
    </NavigationMenu>
  );
}
