import FileExtensionIcon from "@/components/icons/file-extension";
import LanguageIcon from "@/components/icons/language";
import ThesisTypeIcon, {
  getThesisTypeColorClassName,
} from "@/components/icons/thesis-type";
import {
  Button,
  LinkButton,
  minButtonSizeEnforcerClassName,
} from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { TThesisExtended } from "@/server/meili/types";
import { CalendarIcon, LandmarkIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  thesis: TThesisExtended;
  isPlaceholder: false;
};
/* | {
      thesis: null;
      isPlaceholder: true;
    }; */

const noTitle = "Başlık Yok";
const noTranslatedTitle = "Çeviri Yok";
const noAuthor = "Yazar Bilgisi Yok";

export default function ThesisSearchResultRow({ thesis }: Props) {
  return (
    <div className="pt-3.5 pb-4.5 first-of-type:border-t border-b flex flex-row items-start gap-4">
      <div className="flex shrink-0 min-w-12 -mt-0.5 flex-col items-center">
        <LinkButton
          variant="ghost"
          href={`/thesis/${thesis.id}`}
          className="flex shrink flex-col text-xs font-mono justify-start items-start gap-0.5 px-1.5 py-1 rounded-md"
        >
          <p className="flex-1 min-w-0 font-medium leading-tight font-sans text-muted-foreground">
            Tez No
          </p>
          <p className="flex-1 min-w-0 font-bold">{thesis.id}</p>
        </LinkButton>
        {thesis.pdf_url ? (
          <LinkButton
            target="_blank"
            href={thesis.pdf_url}
            variant="destructive-ghost"
            size="icon"
            className="rounded-lg"
          >
            <FileExtensionIcon variant="pdf" className="size-7" />
          </LinkButton>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-lg" disabled>
            <FileExtensionIcon variant="no-pdf" className="size-7" />
          </Button>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <Link
          href={`/thesis/${thesis.id}`}
          className="text-base font-semibold leading-tight not-touch:hover:underline active:underline focus-visible:underline py-0.5 -mt-0.5"
        >
          {thesis.title_original || noTitle}
        </Link>
        <p className="mt-1 text-sm leading-tight font-medium text-muted-foreground">
          {thesis.title_translated || noTranslatedTitle}
        </p>
        <div className="w-full flex mt-2">
          <p className="shrink min-w-0 text-base leading-snug">
            {thesis.author || noAuthor}
          </p>
        </div>
        <div className="w-full flex flex-wrap mt-3 gap-1.5">
          <div
            className={cn(
              "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1",
              getThesisTypeColorClassName(thesis.thesis_type)
            )}
          >
            <ThesisTypeIcon
              variant={thesis.thesis_type}
              className="size-3.5 -ml-0.5 -my-2"
            />
            <p className="shrink min-w-0 text-sm leading-none font-medium">
              {thesis.thesis_type}
            </p>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground"
            )}
          >
            <LanguageIcon
              variant={thesis.language}
              className="size-3.5 -ml-0.75 -my-2 rounded-full overflow-hidden"
            />
            <p className="shrink min-w-0 text-sm leading-none font-medium">
              {thesis.language}
            </p>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground"
            )}
          >
            <CalendarIcon className="size-3.5 -ml-0.75 -my-2" />
            <p className="shrink min-w-0 text-sm leading-none font-medium">
              {thesis.year}
            </p>
          </div>
          <Link
            href={`/university/${thesis.university}`}
            className={cn(
              "px-2 py-1 rounded-full z-0 relative shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
              "not-touch:hover:bg-foreground/16 active:bg-foreground/16",
              "focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              minButtonSizeEnforcerClassName
            )}
          >
            <LandmarkIcon className="size-3.5 -ml-0.75 -my-2" />
            <p className="shrink min-w-0 text-sm leading-none font-medium">
              {thesis.university}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
