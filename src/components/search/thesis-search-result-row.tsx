import FileExtensionIcon from "@/components/icons/sets/file-extension";
import LandmarkIcon from "@/components/icons/landmark";
import LanguageIcon from "@/components/icons/language";
import ThesisTypeIcon, {
  getThesisTypeColorClassName,
} from "@/components/icons/sets/thesis-type";
import { cleanAdvisors } from "@/components/search/helpers";
import {
  Button,
  LinkButton,
  minButtonSizeEnforcerClassName,
} from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { TThesisExtended } from "@/server/meili/types";
import Link from "next/link";
import PenToolIcon from "@/components/icons/pen-tool";
import UserPenIcon from "@/components/icons/user-pen";
import CalendarIcon from "@/components/icons/calendar";
import BuildingIcon from "@/components/icons/building";

type Props =
  | (
      | {
          thesis: TThesisExtended;
          isPlaceholder?: false;
        }
      | {
          thesis?: null;
          isPlaceholder: true;
        }
    ) & { className?: string; disableUniversityLink?: boolean };

const noTitle = "Başlık Yok";
const noTranslatedTitle = "Başlık çevirisi yok";
const noAuthor = "Yazar Bilgisi Yok";

export default function ThesisSearchResultRow({
  thesis,
  isPlaceholder,
  className,
  disableUniversityLink,
}: Props) {
  return (
    <div
      data-placeholder={isPlaceholder ? true : undefined}
      className={cn(
        "pt-3.5 pb-4.5 last-of-type:border-b-0 border-b border-foreground/10 flex flex-row items-start gap-4 group/row",
        className
      )}
    >
      <div className="flex shrink-0 min-w-12 -mt-0.5 flex-col items-center">
        {isPlaceholder ? (
          <div className="flex shrink flex-col text-xs font-mono justify-start items-start gap-0.5 px-1.5 py-1 rounded-md">
            <p className="flex-1 min-w-0 font-medium leading-tight font-sans text-transparent bg-muted-foreground animate-skeleton rounded-sm">
              Tez No
            </p>
            <p className="flex-1 min-w-0 font-bold text-transparent bg-foreground animate-skeleton rounded-sm">
              100000
            </p>
          </div>
        ) : (
          <LinkButton
            variant="ghost"
            href={`/thesis/${thesis.id}`}
            className="flex shrink flex-col text-xs font-mono justify-start items-start gap-0.5 px-1.5 py-1 rounded-md"
          >
            <p className="flex-1 min-w-0 font-medium leading-tight font-sans text-muted-foreground">
              Tez No
            </p>
            <p className="flex-1 min-w-0 font-bold">
              {isPlaceholder ? "100000" : thesis.id}
            </p>
          </LinkButton>
        )}
        {isPlaceholder ? (
          <Button
            aria-label="PDF İndir"
            variant="ghost"
            size="icon"
            className="rounded-lg animate-skeleton"
            disabled
          >
            <div className="size-7 bg-muted-foreground rounded-md" />
          </Button>
        ) : thesis.pdf_url ? (
          <LinkButton
            aria-label="PDF İndir"
            target="_blank"
            href={thesis.pdf_url}
            variant="destructive-ghost"
            size="icon"
            className="rounded-lg"
          >
            <FileExtensionIcon variant="pdf" className="size-7" />
          </LinkButton>
        ) : (
          <Button
            aria-label="PDF İndir"
            variant="ghost"
            size="icon"
            className="rounded-lg"
            disabled
          >
            <FileExtensionIcon variant="pdf-x" className="size-7" />
          </Button>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-start">
        {isPlaceholder ? (
          <div className="max-w-full text-balance pr-2 min-w-0 text-base font-semibold leading-tight bg-foreground text-transparent animate-skeleton py-0.5 -mt-0.5 rounded-md">
            Başlık yükleniyor................................
          </div>
        ) : (
          <Link
            href={`/thesis/${thesis.id}`}
            className="max-w-full text-balance pr-2 min-w-0 text-base font-semibold leading-tight not-touch:hover:underline active:underline focus-visible:underline py-0.5 -mt-0.5"
          >
            {thesis.title_original || noTitle}
          </Link>
        )}
        <p
          className="mt-1 max-w-full text-balance pr-2 min-w-0 text-sm leading-tight font-medium text-muted-foreground
          group-data-[placeholder]/row:text-transparent
          group-data-[placeholder]/row:bg-muted-foreground
          group-data-[placeholder]/row:animate-skeleton
          group-data-[placeholder]/row:rounded-sm"
        >
          {isPlaceholder
            ? "Başlık çevirisi yükleniyor..."
            : thesis.title_translated || noTranslatedTitle}
        </p>
        <div className="w-full flex mt-2 justify-start items-center gap-1">
          {!isPlaceholder && thesis.author && (
            <PenToolIcon className="size-4 shrink-0" />
          )}
          <p
            className="shrink min-w-0 text-base leading-snug
              group-data-[placeholder]/row:text-transparent
              group-data-[placeholder]/row:bg-muted-foreground
              group-data-[placeholder]/row:animate-skeleton
              group-data-[placeholder]/row:rounded-md"
          >
            {isPlaceholder ? "Yazar yükleniyor..." : thesis.author || noAuthor}
          </p>
        </div>
        {/* Chips */}
        <div className="w-full flex flex-wrap mt-3 gap-1.5">
          <div
            className={cn(
              "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1",
              "group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground",
              getThesisTypeColorClassName({
                variant: isPlaceholder ? null : thesis.thesis_type,
              })
            )}
          >
            {!isPlaceholder && (
              <ThesisTypeIcon
                variant={thesis.thesis_type}
                className="size-3.5 -ml-0.5 -my-2 shrink-0"
              />
            )}
            <p
              className="shrink min-w-0 text-sm leading-none font-medium
              group-data-[placeholder]/row:text-transparent"
            >
              {isPlaceholder ? "Yükleniyor..." : thesis.thesis_type}
            </p>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
              "group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground"
            )}
          >
            {!isPlaceholder && (
              <LanguageIcon
                variant={thesis.language}
                className="size-3.5 -ml-0.75 -my-2 rounded-full overflow-hidden shrink-0"
              />
            )}
            <p
              className="shrink min-w-0 text-sm leading-none font-medium
              group-data-[placeholder]/row:text-transparent"
            >
              {isPlaceholder ? "Yükleniyor..." : thesis.language}
            </p>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
              "group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground"
            )}
          >
            {!isPlaceholder && (
              <CalendarIcon className="size-3.5 -ml-0.75 -my-2 shrink-0" />
            )}
            <p
              className="shrink min-w-0 text-sm leading-none font-medium
              group-data-[placeholder]/row:text-transparent"
            >
              {isPlaceholder ? "Yükleniyor..." : thesis.year}
            </p>
          </div>
          {isPlaceholder ? (
            <div
              className={cn(
                "px-2 py-1 rounded-full z-0 relative shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
                "group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground",
                minButtonSizeEnforcerClassName
              )}
            >
              <p
                className="shrink min-w-0 text-sm leading-none font-medium
                group-data-[placeholder]/row:text-transparent"
              >
                Yükleniyor...
              </p>
            </div>
          ) : disableUniversityLink ? (
            <div
              className="px-2 py-1 rounded-full z-0 relative shrink min-w-0 border flex items-center 
              gap-1 bg-foreground/8 border-foreground/12 text-foreground"
            >
              <LandmarkIcon className="size-3.5 -ml-0.75 -my-2 shrink-0" />
              <p className="shrink min-w-0 text-sm leading-none font-medium">
                {thesis.university}
              </p>
            </div>
          ) : (
            <Link
              href={`/university/${thesis.university}`}
              className={cn(
                "px-2 py-1 rounded-full z-0 relative shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
                "not-touch:hover:bg-foreground/16 active:bg-foreground/16",
                "focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                minButtonSizeEnforcerClassName
              )}
            >
              <LandmarkIcon className="size-3.5 -ml-0.75 -my-2 shrink-0" />
              <p className="shrink min-w-0 text-sm leading-none font-medium">
                {thesis.university}
              </p>
            </Link>
          )}
          {thesis?.department &&
            (isPlaceholder ? (
              <div
                className={cn(
                  "px-2 py-1 rounded-full z-0 relative shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
                  "group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground",
                  minButtonSizeEnforcerClassName
                )}
              >
                <p
                  className="shrink min-w-0 text-sm leading-none font-medium
                  group-data-[placeholder]/row:text-transparent"
                >
                  Yükleniyor...
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "px-2 py-1 rounded-full z-0 relative shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
                  minButtonSizeEnforcerClassName
                )}
              >
                <BuildingIcon className="size-3.5 -ml-0.75 -my-2 shrink-0" />
                <p className="shrink min-w-0 text-sm leading-none font-medium">
                  {thesis.department}
                </p>
              </div>
            ))}
          {cleanAdvisors(thesis?.advisors || ["Yükleniyor..."]).map(
            (advisor, index) => (
              <div
                key={`${advisor}-${index}`}
                className={cn(
                  "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
                  "group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground"
                )}
              >
                {!isPlaceholder && (
                  <UserPenIcon className="size-3.5 -ml-0.75 -my-2 shrink-0" />
                )}
                <p
                  className="shrink min-w-0 text-sm leading-none font-medium
                  group-data-[placeholder]/row:text-transparent"
                >
                  {advisor}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
