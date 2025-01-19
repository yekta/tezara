import PopularSubjectsChart from "@/app/university/[name]/_components/popular-subjects-chart";
import ThesesCountsByYearsChart from "@/app/university/[name]/_components/theses-counts-by-years-chart";
import { cachedGetPageData } from "@/app/university/[name]/helpers";
import ThesisSearchResultRow from "@/components/search/thesis-search-result-row";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getUniversities } from "@/server/meili/repo/university";
import {
  FolderClosedIcon,
  GlobeIcon,
  KeyRoundIcon,
  ScrollTextIcon,
} from "lucide-react";
import { Metadata } from "next";
import { FC } from "react";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function Page({ params }: Props) {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);

  const {
    thesesCount,
    languages,
    subjects,
    keywords,
    minYear,
    maxYear,
    thesesCountsByYearsChartData,
    popularSubjectsChartData,
    thesisTypes,
    lastThesesRes,
  } = await cachedGetPageData({
    name: parsedName,
  });

  return (
    <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-2 md:px-8 pb-32">
      {/* Title */}
      <div className="w-full flex flex-col px-4">
        <div className="w-full flex items-center flex-wrap gap-1.5">
          <h1 className="max-w-full font-bold text-2xl text-balance leading-tight pr-1">
            {parsedName}
          </h1>
          <p className="bg-foreground/10 border border-foreground/20 rounded-full font-medium text-sm px-2 py-0.25">
            {minYear}-{maxYear}
          </p>
        </div>
        <div className="w-full flex flex-wrap items-center mt-3 md:mt-2 gap-1.5">
          <Stat value={thesesCount} label="Tez" Icon={ScrollTextIcon} />
          <Stat value={languages.size} label="Dil" Icon={GlobeIcon} />
          <Stat value={subjects.size} label="Konu" Icon={FolderClosedIcon} />
          <Stat
            value={keywords.size}
            label="Anahtar Kelime"
            Icon={KeyRoundIcon}
          />
        </div>
      </div>
      <ThesesCountsByYearsChart
        className="mt-6"
        chartData={thesesCountsByYearsChartData}
        dataKeys={thesisTypes}
      />
      <PopularSubjectsChart
        className="mt-8"
        chartData={popularSubjectsChartData}
        dataKeys={popularSubjectsChartData.map((data) => data.keyword)}
      />
      <div className="w-full flex flex-col mt-8">
        <h2 className="font-bold px-4 text-xl">Son 10 Tez</h2>
        <div className="w-full flex flex-col px-3 mt-3">
          {lastThesesRes.map((t) => (
            <ThesisSearchResultRow
              className="first-of-type:border-t last-of-type:border-b"
              key={t.id}
              thesis={t}
              disableUniversityLink
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  Icon,
}: {
  value: number;
  label: string;
  Icon: FC<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-1 text-base leading-tight pr-3">
      <Icon className="inline size-4 text-foreground shrink-0" />
      <p className="font-semibold text-foreground shrink min-w-0">
        {value.toLocaleString()}
        <span className="font-medium text-muted-foreground"> {label}</span>
      </p>
    </div>
  );
}

export async function generateStaticParams() {
  const data = await getUniversities({ client: meiliAdmin });
  return data.hits.map((u) => ({
    name: u.name,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);
  const notFoundTitle = `Üniversite Bulunamadı | ${siteTitle}`;
  const notFoundDescription = `Üniversite ${siteTitle} platformunda mevcut değil.`;

  if (!name) {
    return {
      title: notFoundTitle,
      description: notFoundDescription,
      twitter: getTwitterMeta({
        title: notFoundTitle,
        description: notFoundDescription,
      }),
    };
  }

  const locale = "tr";
  const { keywords, subjects, languages, minYear, maxYear, thesesCount } =
    await cachedGetPageData({ name: parsedName });
  const title = `${parsedName} Tez İstatistikleri | ${siteTitle}`;
  const description = `${parsedName} bünyesinde ${minYear}-${maxYear} yılları arasında ${subjects.size.toLocaleString(
    locale
  )} farklı konuda toplam ${thesesCount.toLocaleString(
    locale
  )} tez üretilmiş. ${languages.size.toLocaleString(
    locale
  )} farklı dil ve ${keywords.size.toLocaleString(
    locale
  )} farklı anahtar kelime kullanılmış.`;

  return {
    title,
    description,
    twitter: getTwitterMeta({
      title,
      description,
      noImages: true,
    }),
  };
}
