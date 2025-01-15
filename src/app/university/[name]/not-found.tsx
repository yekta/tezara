"use client";

import { SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const name = pathname.split("/").pop();

  return (
    <div className="w-full shrink min-w-0 max-w-2xl flex flex-col items-center flex-1 md:pt-2 pb-32">
      <h1
        id="title"
        className="font-semibold text-muted-foreground text-center text-2xl leading-tight"
      >
        <span className="font-bold text-foreground">
          {'"'}
          {name}
          {'"'}
        </span>{" "}
        bulunamadı.
      </h1>
      <SearchIcon className="size-12 text-muted-more-foreground mt-3" />
    </div>
  );
}
