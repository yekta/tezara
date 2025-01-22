"use client";

import NavigationSection from "@/app/thesis/[id]/_components/NavigationSection";
import { SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const id = pathname.split("/").pop();
  const idNumber = parseInt(Number(id).toString());
  const isIdValid = !isNaN(idNumber) && idNumber > 0;

  return (
    <div className="w-full shrink min-w-0 max-w-2xl flex flex-col flex-1 md:pt-2 pb-20 md:pb-32">
      <NavigationSection id={idNumber} className="md:hidden pb-4" />
      <div className="max-w-full flex flex-col flex-1 min-w-0 items-center border rounded-xl justify-center pt-12 pb-[calc(2.5rem+5vh)]">
        <h1
          id="title"
          className="max-w-full px-8 text-balance min-w-0 font-semibold text-muted-foreground text-center text-2xl leading-tight"
        >
          Tez{" "}
          {isIdValid && (
            <span className="font-bold text-foreground">#{idNumber} </span>
          )}
          bulunamadı
        </h1>
        <SearchIcon className="size-12 text-muted-more-foreground mt-3" />
      </div>
      <NavigationSection id={idNumber} className="md:hidden py-4" />
    </div>
  );
}
