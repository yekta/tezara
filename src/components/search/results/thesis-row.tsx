"use client";

import { subjectsRoute } from "@/app/subjects/_components/constants";
import { thesesRoute } from "@/app/theses/_components/constants";
import { universitiesRoute } from "@/app/universities/_components/constants";
import LanguageIcon from "@/components/icons/language";
import FileExtensionIcon from "@/components/icons/sets/file-extension";
import { getThesisTypeColorClassName } from "@/components/icons/sets/thesis-type";
import ThesisTypeIconWithFont from "@/components/icons/sets/thesis-type-with-font";
import { useSearchParamsClientOnly } from "@/components/providers/search-params-client-only-provider";
import { cleanAdvisors, getThesisRowId } from "@/components/search/helpers";
import {
  Button,
  LinkButton,
  minButtonSizeEnforcerClassName,
} from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { previousPathAtom } from "@/lib/store/main";
import { TThesis } from "@/server/meili/types";
import { useSetAtom } from "jotai";
import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

type Props =
  | (
      | {
          thesis: TThesis;
          isPlaceholder?: false;
        }
      | {
          thesis?: null;
          isPlaceholder: true;
        }
    ) & {
      className?: string;
      disableUniversityLink?: boolean;
      disableSubjectLink?: boolean;
      pagePathname: string;
    };

const noTitle = "Başlık Yok";
const noTranslatedTitle = "Başlık çevirisi yok";
const noAuthor = "Yazar Bilgisi Yok";

export default function ThesisRow({
  thesis,
  isPlaceholder,
  className,
  disableUniversityLink,
  disableSubjectLink,
  pagePathname,
}: Props) {
  const [, searchParamsStr] = useSearchParamsClientOnly();
  const setPreviousPath = useSetAtom(previousPathAtom);
  const hash = thesis ? `#${getThesisRowId(thesis.id)}` : "";
  const setPrevious = () => {
    setPreviousPath(`${pagePathname}${searchParamsStr}${hash}`);
  };

  const thesisLinkProps: LinkProps = {
    href: `${thesesRoute}/${thesis?.id}`,
    prefetch: false,
    onClick: setPrevious,
  };

  const turkishSubjects = thesis?.subjects?.filter(
    (s) => s.language === "Turkish"
  );
  const firstThesisSubject = turkishSubjects?.length
    ? turkishSubjects[0].name
    : null;

  return (
    <li
      id={thesis ? getThesisRowId(thesis.id) : undefined}
      data-placeholder={isPlaceholder ? true : undefined}
      className={cn(
        "pt-3.5 pb-5 smpt-4 sm:pb-5.5 px-1 last-of-type:border-b-0 border-b border-foreground/10 flex flex-col sm:flex-row sm:px-0 sm:gap-4 items-start gap-2 group/row",
        className
      )}
    >
      <div className="flex shrink-0 items-center sm:items-end sm:justify-start -mt-1 sm:-mt-0.5 flex-row flex-wrap sm:flex-col sm:-ml-0 -ml-1.5">
        {isPlaceholder ? (
          <div className="sm:min-w-14 flex shrink flex-col text-xs font-mono justify-start items-start sm:items-end gap-0.5 px-1.5 py-1 rounded-md">
            <p className="text-left sm:text-right flex-1 min-w-0 font-medium leading-tight font-sans text-transparent bg-muted-foreground animate-skeleton rounded-sm">
              Tez No
            </p>
            <p className="text-left sm:text-right flex-1 min-w-0 font-bold text-transparent bg-foreground animate-skeleton rounded-sm">
              100000
            </p>
          </div>
        ) : (
          <LinkButton
            variant="ghost"
            {...thesisLinkProps}
            className="sm:min-w-14 flex shrink flex-col text-xs font-mono justify-start items-start sm:items-end gap-0.5 px-1.5 py-1 rounded-md"
          >
            <p className="text-left sm:text-right flex-1 min-w-0 font-medium leading-tight font-sans text-muted-foreground">
              Tez No
            </p>
            <p className="text-left sm:text-right flex-1 min-w-11 font-bold">
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
      <div className="w-full min-w-0 flex flex-col items-start -mt-1 sm:-mt-0.5">
        {isPlaceholder ? (
          <div className="max-w-full text-balance pr-2 min-w-0 text-base font-semibold leading-tight bg-foreground text-transparent animate-skeleton py-0.5 rounded-md">
            Başlık yükleniyor................................
          </div>
        ) : (
          <Link
            {...thesisLinkProps}
            className="max-w-full text-balance pr-2 min-w-0 text-base font-semibold leading-tight not-touch:hover:underline active:underline focus-visible:underline py-0.5"
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
        <p
          className="w-full mt-2 min-w-0 text-base leading-snug group-data-[placeholder]/row:text-transparent
          group-data-[placeholder]/row:bg-muted-foreground group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:rounded-md"
        >
          <span className="font-icon icon-pen-tool mr-1" />
          {isPlaceholder ? "Yazar yükleniyor..." : thesis.author || noAuthor}
        </p>
        {/* Chips */}
        <div className="w-full flex flex-wrap mt-3 gap-1.5">
          <p
            className={`${getThesisTypeColorClassName({
              variant: isPlaceholder ? null : thesis.thesis_type,
            })} px-2 py-1 rounded-full shrink min-w-0 border group-data-[placeholder]/row:animate-skeleton 
            group-data-[placeholder]/row:bg-muted-more-foreground text-sm leading-none font-medium group-data-[placeholder]/row:text-transparent`}
          >
            {!isPlaceholder && (
              <ThesisTypeIconWithFont
                variant={thesis.thesis_type}
                className="-ml-0.5 font-normal mr-1"
              />
            )}
            {isPlaceholder ? "Yükleniyor..." : thesis.thesis_type}
          </p>
          <div
            className={cn(
              "px-2 py-1 rounded-full shrink min-w-0 border flex items-center gap-1 bg-foreground/8 border-foreground/12 text-foreground",
              "group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground"
            )}
          >
            {!isPlaceholder && (
              <LanguageIcon
                variant={thesis.language}
                className="size-4 -ml-1 -my-3 rounded-full overflow-hidden shrink-0"
              />
            )}
            <p
              className="shrink min-w-0 text-sm leading-none font-medium
              group-data-[placeholder]/row:text-transparent"
            >
              {isPlaceholder ? "Yükleniyor..." : thesis.language}
            </p>
          </div>
          <Chip classNameIcon="icon-calendar">
            {isPlaceholder ? "Yükleniyor..." : thesis.year}
          </Chip>
          {isPlaceholder ? (
            <Chip classNameIcon="icon-folder-closed">Yükleniyor...</Chip>
          ) : firstThesisSubject ? (
            disableSubjectLink ? (
              <Chip classNameIcon="icon-folder-closed">
                {firstThesisSubject}
              </Chip>
            ) : (
              <Link
                prefetch={false}
                href={`${subjectsRoute}/${encodeURIComponent(
                  firstThesisSubject
                )}`}
                onClick={setPrevious}
                className={`${minButtonSizeEnforcerClassName} px-2 py-1 rounded-full z-0 relative shrink min-w-0 border bg-foreground/8 
                border-foreground/12 text-foreground not-touch:hover:bg-foreground/16 active:bg-foreground/16
                focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm leading-none font-medium`}
              >
                <span className="font-icon icon-folder-closed -ml-0.5 mr-1" />
                {firstThesisSubject}
              </Link>
            )
          ) : null}
          {isPlaceholder || disableUniversityLink ? (
            <Chip classNameIcon="icon-landmark">
              {isPlaceholder ? "Yükleniyor..." : thesis.university}
            </Chip>
          ) : (
            <Link
              prefetch={false}
              href={`${universitiesRoute}/${thesis.university}`}
              onClick={setPrevious}
              className={`${minButtonSizeEnforcerClassName} px-2 py-1 rounded-full z-0 relative shrink min-w-0 border bg-foreground/8 
                border-foreground/12 text-foreground not-touch:hover:bg-foreground/16 active:bg-foreground/16
                focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm leading-none font-medium`}
            >
              <span className="font-icon icon-landmark -ml-0.5 mr-1" />
              {thesis.university}
            </Link>
          )}
          {(isPlaceholder || thesis?.department) && (
            <Chip classNameIcon="icon-building">
              {isPlaceholder ? "Yükleniyor..." : thesis.department}
            </Chip>
          )}
          {cleanAdvisors(thesis?.advisors || ["Yükleniyor..."]).map(
            (advisor, index) => (
              <Chip classNameIcon="icon-user-pen" key={`${advisor}-${index}`}>
                {advisor}
              </Chip>
            )
          )}
        </div>
      </div>
    </li>
  );
}

function Chip({
  classNameIcon,
  children,
}: {
  classNameIcon: string;
  children: ReactNode;
}) {
  return (
    <p
      className="px-2 py-1 rounded-full shrink min-w-0 border bg-foreground/8 border-foreground/12 
      text-foreground group-data-[placeholder]/row:animate-skeleton group-data-[placeholder]/row:bg-muted-more-foreground
      text-sm leading-none font-medium group-data-[placeholder]/row:text-transparent"
    >
      <span className={`${classNameIcon} font-icon -ml-0.5 mr-1`} />
      {children}
    </p>
  );
}
