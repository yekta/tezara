import UniversityPaginationBar from "@/app/university/_components/university-pagination-bar";
import CalendarIcon from "@/components/icons/calendar";
import FolderClosedIcon from "@/components/icons/folder-closed";
import GlobeIcon from "@/components/icons/globe";
import KeyRoundIcon from "@/components/icons/key-round";
import LandmarkIcon from "@/components/icons/landmark";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import { LinkButton } from "@/components/ui/button";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { apiServer } from "@/server/trpc/setup/server";
import { Metadata } from "next";
import { FC } from "react";

const locale = "tr";

export default async function Page() {
  const start = performance.now();
  const page = 1;
  const universities = await apiServer.main.getUniversities({ page });
  console.log(
    `/university:getUniversities(${page}) | ${Math.round(
      performance.now() - start
    )}ms`
  );

  const totalCount = universities[0].total_count;

  return (
    <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-2 md:px-8 pb-32">
      {/* Title */}
      <div className="w-full flex flex-col px-4">
        <div className="w-full flex items-center flex-wrap gap-1.5">
          <h1 className="max-w-full font-bold text-3xl text-balance leading-tight pr-1">
            Üniversiteler
          </h1>
          <p className="bg-foreground/10 rounded-full font-semibold text-sm px-2.5 py-0.5">
            {totalCount.toLocaleString(locale)}
          </p>
        </div>
        <div className="w-full flex flex-wrap items-center mt-3 md:mt-2 gap-1.5"></div>
      </div>
      <div className="w-full px-2 md:pt-2">
        <UniversityPaginationBar className="px-1.5" />
      </div>
      <ol className="w-full flex flex-wrap px-1 py-1">
        {universities.map((university, index) => (
          <li
            key={`${university.name}-${index}`}
            className="w-full flex md:w-1/2 lg:w-1/3 p-1"
          >
            <LinkButton
              href={`/university/${encodeURIComponent(university.name)}`}
              variant="outline"
              className="w-full min-h-48 flex flex-col gap-6 rounded-xl px-4 pt-3.5 pb-4 items-start justify-start"
            >
              <div className="w-full flex-1 flex items-start justify-start gap-1.5">
                <LandmarkIcon className="size-4 inline shrink-0 -ml-0.5 mt-0.5" />
                <div className="shrink min-w-0 gap-0.5 flex flex-col items-start">
                  <h3 className="shrink min-w-0 text-left text-balance leading-tight font-bold">
                    {university.name}
                  </h3>
                </div>
              </div>
              <div className="w-full text-sm gap-2 flex flex-wrap">
                <Stat
                  value={`${university.year_start}-${university.year_end}`}
                  label="Tez Yılları"
                  hideLabel
                  Icon={CalendarIcon}
                />
                <Stat
                  value={university.thesis_count}
                  label="Tez"
                  Icon={ScrollTextIcon}
                />
                <Stat
                  value={university.language_count}
                  label="Dil"
                  Icon={GlobeIcon}
                />
                <Stat
                  value={university.turkish_subject_count}
                  label="Konu"
                  Icon={FolderClosedIcon}
                />
                <Stat
                  value={university.turkish_keyword_count}
                  label="Anahtar Kelime"
                  Icon={KeyRoundIcon}
                />
              </div>
            </LinkButton>
          </li>
        ))}
      </ol>
      <div className="w-full px-2">
        <UniversityPaginationBar className="px-1.5" />
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  Icon,
  hideLabel,
}: {
  value: number | string;
  label: string;
  Icon: FC<{ className?: string }>;
  hideLabel?: boolean;
}) {
  return (
    <div className="flex shrink min-w-0 items-center gap-1 leading-tight pr-2 text-muted-foreground">
      <Icon className="inline size-3.5 shrink-0" />
      <p className="font-bold shrink min-w-0 text-left">
        {typeof value === "number" ? value.toLocaleString() : value}
        {!hideLabel && <span className="font-medium"> {label}</span>}
      </p>
    </div>
  );
}

const title = `Üniversiteler | ${siteTitle}`;
const description =
  "YÖK'e bağlı üniversitelerin tez istatistiklerini görüntüle. Yıllara göre tez sayıları, popüler tez konuları, tezlerde kullanılan diller ve tez türleri gibi verilere ulaş.";

export const metadata: Metadata = {
  title,
  description,
  twitter: getTwitterMeta({
    title,
    description,
  }),
};
