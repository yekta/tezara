"use client";

import { SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const id = pathname.split("/").pop();
  const idNumber = parseInt(Number(id).toString());
  const isIdValid = !isNaN(idNumber) && idNumber > 0;

  return (
    <div className="w-full shrink min-w-0 max-w-2xl flex flex-col items-center flex-1 md:pt-2 pb-32">
      {/* Title */}
      <h1
        id="title"
        className="font-semibold text-muted-foreground text-center text-2xl leading-tight"
      >
        Tez{" "}
        {isIdValid && (
          <span className="font-bold text-foreground">#{idNumber} </span>
        )}
        bulunamadı.
      </h1>
      <SearchIcon className="size-12 text-muted-more-foreground mt-3" />
    </div>
  );
}
