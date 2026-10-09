import NavigationSection from "@/app/theses/[id]/_components/NavigationSection";
import { FileXIcon } from "lucide-react";

export default function ThesisRemoved({ id }: { id: number }) {
  return (
    <div className="w-full shrink min-w-0 max-w-2xl flex flex-col flex-1 md:pt-2 pb-20 md:pb-32">
      <NavigationSection id={id} className="md:hidden pb-4" />
      <div className="w-full flex-1 flex flex-col items-center justify-center border rounded-xl pt-12 pb-[calc(2.5rem+5vh)]">
        <FileXIcon className="size-12 text-muted-more-foreground mt-3" />
        <h1
          id="title"
          className="max-w-full pt-3 px-6 text-balance min-w-0 font-semibold text-muted-foreground text-center text-2xl leading-tight"
        >
          Tez <span className="font-bold text-foreground">#{id} </span>
          yazarın talebi üzerine kaldırıldı
        </h1>
      </div>
      <NavigationSection id={id} className="md:hidden py-4" />
    </div>
  );
}
