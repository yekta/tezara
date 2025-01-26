"use client";

import { universitiesRoute } from "@/app/universities/constants/main";
import LandmarkIcon from "@/components/icons/landmark";
import { SearchIcon } from "@/components/icons/search-icon";
import {
  LinkButton,
  minButtonSizeEnforcerClassName,
} from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { usePathname } from "next/navigation";
import { FC } from "react";

type Props = {
  className?: string;
  classNameTab?: string;
};

type TTab = {
  label: string;
  href: string;
  pathname: string;
  Icon: FC<{ className?: string }>;
};

export default function NavbarTabs({ className, classNameTab }: Props) {
  const pathname = usePathname();
  const isOnPath = (href: string) =>
    pathname === href || pathname.startsWith(href);

  const tabs: TTab[] = [
    { label: "Ara", pathname: "/search", href: "/search", Icon: SearchIcon },
    {
      label: "Üniversiteler",
      pathname: universitiesRoute,
      href: universitiesRoute,
      Icon: LandmarkIcon,
    },
  ];

  return (
    <div className={cn("flex h-full shrink min-w-0 items-center", className)}>
      {tabs.map((tab) => (
        <LinkButton
          variant="ghost"
          size="sm"
          data-active={isOnPath(tab.pathname) ? true : undefined}
          key={tab.href}
          href={tab.href}
          className={cn(
            `${minButtonSizeEnforcerClassName} py-1.5 z-10 pointer-events-auto relative text-sm text-muted-foreground data-[active]:text-foreground
            shrink min-w-0 data-[active]:bg-border/60 rounded-full h-full flex items-center justify-center 
            px-3.5 gap-1.5 font-semibold not-touch:hover:bg-transparent active:bg-transparent not-touch:hover:text-foreground active:text-foreground
            data-[active]:not-touch:hover:bg-border/60 data-[active]:active:bg-border/75 data-[active]:not-touch:hover:text-foreground data-[active]:active:text-foreground`,
            classNameTab
          )}
        >
          <tab.Icon className="size-4 -my-1 -ml-0.75" />
          <p className="shrink min-w-0 overflow-hidden overflow-ellipsis whitespace-nowrap">
            {tab.label}
          </p>
        </LinkButton>
      ))}
    </div>
  );
}
