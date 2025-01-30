import { subjectsRoute } from "@/app/subjects/_components/constants";
import { LinkButton } from "@/components/ui/button";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full shrink min-w-0 max-w-2xl flex flex-col flex-1 md:pt-2 pb-20 md:pb-32 px-3">
      <div className="w-full flex-1 flex flex-col items-center justify-center border rounded-xl px-4 pt-12 pb-[calc(2.5rem+5vh)]">
        <SearchIcon className="size-12 text-muted-more-foreground mt-3" />
        <h1
          id="title"
          className="max-w-full pt-3 text-balance min-w-0 font-semibold text-muted-foreground text-center text-2xl leading-tight"
        >
          Konu bulunamadı
        </h1>
        <LinkButton href={subjectsRoute} className="mt-5">
          <ArrowLeftIcon className="size-5 -my-5 -ml-1.5" />
          <p className="shrink min-w-0">Tüm Konular</p>
        </LinkButton>
      </div>
    </div>
  );
}
