"use client";

import { universitiesRoute } from "@/app/universities/_components/constants";
import FolderClosedIcon from "@/components/icons/folder-closed";
import LandmarkIcon from "@/components/icons/landmark";
import { SearchIcon } from "@/components/icons/search-icon";
import {
  LinkButton,
  minButtonSizeEnforcerClassName,
} from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { usePathname } from "next/navigation";
import { FC, useEffect, useState } from "react";

type Props = {
  className?: string;
  classNameTab?: string;
};

type TTab = {
  label: string;
  href: string;
  Icon: FC<{ className?: string }>;
};

export default function NavbarTabs({ className, classNameTab }: Props) {
  const pathname = usePathname();
  const tabs: TTab[] = [
    { label: "Ara", href: "/search", Icon: SearchIcon },
    {
      label: "Üniversiteler",
      href: universitiesRoute,
      Icon: LandmarkIcon,
    },
    {
      label: "Konular",
      href: "/subjects",
      Icon: FolderClosedIcon,
    },
  ];

  const isActive = (href: string) => (lastClickedTab === href ? true : false);
  const isTab = (pathname: string) => tabs.some((tab) => tab.href === pathname);

  const [lastClickedTab, setLastClickedTab] = useState<string | null>(
    isTab(pathname) ? pathname : null
  );

  useEffect(() => {
    if (isTab(pathname)) {
      setLastClickedTab(pathname);
    } else {
      setLastClickedTab(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className={cn("flex h-full shrink min-w-0 items-center", className)}>
      {tabs.map((tab) => (
        <LinkButton
          variant="ghost"
          size="sm"
          data-active={isActive(tab.href) ? true : undefined}
          key={tab.href}
          href={tab.href}
          onClick={() => setLastClickedTab(tab.href)}
          className={cn(
            `${minButtonSizeEnforcerClassName} py-1 sm:py-1.5 z-10 pointer-events-auto relative text-xs sm:text-sm text-muted-foreground data-[active]:text-foreground
            shrink min-w-0 rounded-full h-full flex flex-col sm:flex-row items-center justify-center
            data-[active]:bg-border/75 data-[active]:not-touch:hover:bg-border/75 data-[active]:active:bg-border/75 
            px-2 sm:px-3.5 gap-0.25 sm:gap-1.5 font-semibold not-touch:hover:bg-transparent active:bg-transparent not-touch:hover:text-foreground active:text-foreground
            data-[active]:not-touch:hover:text-foreground data-[active]:active:text-foreground`,
            classNameTab
          )}
        >
          <tab.Icon className="size-5 mt-0.25 sm:size-4 sm:-my-1 sm:-ml-0.75" />
          <p className="w-full sm:w-auto shrink min-w-0 overflow-hidden overflow-ellipsis whitespace-nowrap">
            {tab.label}
          </p>
        </LinkButton>
      ))}
    </div>
  );
}
