import GoBackBar from "@/app/thesis/[id]/go-back-bar";
import { universitiesRoute } from "@/app/universities/_components/constants";
import LanguagesChart from "@/app/university/[name]/_components/languages-chart";
import PopularSubjectsChart from "@/app/university/[name]/_components/popular-subjects-chart";
import ThesesCountsByYearsChart from "@/app/university/[name]/_components/theses-counts-by-years-chart";
import ThesisTypesChart from "@/app/university/[name]/_components/thesis-types-chart";
import { cachedGetPageData } from "@/app/university/[name]/helpers";
import ThesisRowList from "@/components/search/results/thesis-row-list";
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

const locale = "tr";

export default async function Page({ params }: Props) {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);

  const {
    thesesCount,
    languages,
    subjects,
    universityStats,
    minYear,
    maxYear,
    thesesCountsByYearsChartData,
    popularSubjectsChartData,
    thesisTypes,
    lastThesesRes,
    maxThesisYear,
    minThesisYear,
    mostPopularThesisType,
  } = await cachedGetPageData({
    name: parsedName,
  });

  return (
    <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-2 md:pt-0 md:px-8 pb-32">
      <GoBackBar
        className="justify-start px-1.5"
        defaultPath={universitiesRoute}
        buttonText="Geri Dön"
      />
      {/* Title */}
      <div className="w-full flex flex-col px-4 pt-3">
        <div className="w-full flex items-center flex-wrap gap-1.5">
          <h1 className="shrink min-w-0 font-bold text-3xl text-balance leading-tight pr-1">
            {parsedName} Tez İstatistikleri
          </h1>
          <p className="shrink min-w-0 bg-foreground/10 rounded-full leading-tight font-semibold text-sm px-2.5 py-0.75">
            {minYear}-{maxYear}
          </p>
        </div>
        <div className="w-full flex flex-wrap items-center mt-3 md:mt-2 gap-1.5">
          <Stat
            value={universityStats.thesis_count}
            label="Tez"
            Icon={ScrollTextIcon}
          />
          <Stat
            value={universityStats.language_count}
            label="Dil"
            Icon={GlobeIcon}
          />
          <Stat
            value={universityStats.subject_count_turkish}
            label="Konular"
            Icon={FolderClosedIcon}
          />
          <Stat
            value={universityStats.keyword_count_turkish}
            label="Anahtar Kelime"
            Icon={KeyRoundIcon}
          />
        </div>
      </div>
      <p className="w-full px-4 mt-7 leading-relaxed text-base md:text-lg">
        <span className="font-semibold">{parsedName}</span> bünyesinde,{" "}
        <span className="font-semibold">
          {minYear}-{maxYear}
        </span>{" "}
        yılları arasında{" "}
        <span className="font-semibold">
          {subjects.size.toLocaleString(locale)}
        </span>{" "}
        farklı konuda toplam{" "}
        <span className="font-semibold">
          {thesesCount.toLocaleString(locale)}
        </span>{" "}
        tez yazılmıştır. Yazarlar tarafından{" "}
        <span className="font-semibold">
          {languages.size.toLocaleString(locale)}
        </span>{" "}
        farklı dil ve{" "}
        <span className="font-semibold">
          {universityStats.keyword_count_turkish.toLocaleString(locale)}
        </span>{" "}
        farklı anahtar kelime kullanılmıştır. En çok tez{" "}
        <span className="font-semibold">{maxThesisYear.year}</span> yılında
        yazılırken (
        <span className="font-semibold">
          {maxThesisYear.count.toLocaleString(locale)}
        </span>{" "}
        tez), en az tez{" "}
        <span className="font-semibold">{minThesisYear.year}</span> yılında
        yazılmıştır (
        <span className="font-semibold">
          {minThesisYear.count.toLocaleString(locale)}
        </span>{" "}
        tez).{" "}
        {popularSubjectsChartData && popularSubjectsChartData.length > 0 && (
          <>
            Yazarlar tarafından en çok tercih edilen konu {'"'}
            <span className="font-semibold">
              {popularSubjectsChartData[0].keyword}
            </span>
            {'"'} iken (
            <span className="font-semibold">
              {popularSubjectsChartData[0].count.toLocaleString(locale)}
            </span>{" "}
            tez), en çok tercih edilen tez türü ise{" "}
            <span className="font-bold">
              {mostPopularThesisType.thesis_type.toLowerCase()}
            </span>{" "}
            tezidir (
            <span className="font-bold">
              {mostPopularThesisType.count.toLocaleString(locale)}
            </span>{" "}
            tez).
          </>
        )}
      </p>
      <ThesesCountsByYearsChart
        className="pt-8"
        chartData={thesesCountsByYearsChartData}
        dataKeys={Array.from(thesisTypes)
          .sort((a, b) => b[1] - a[1])
          .map(([thesisType]) => thesisType)}
      />
      <PopularSubjectsChart
        className="pt-8"
        chartData={popularSubjectsChartData}
        dataKeys={popularSubjectsChartData.map((data) => data.keyword)}
      />
      <div className="w-full flex flex-col sm:flex-row">
        <LanguagesChart
          className="mt-8 w-full sm:w-1/2 md:w-1/2 lg:w-1/3"
          chartData={Array.from(languages.entries())
            .map(([language, count]) => ({
              language,
              count,
            }))
            .sort((a, b) => b.count - a.count)}
          dataKeys={Array.from(languages.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([language]) => language)}
        />
        <ThesisTypesChart
          className="mt-8 w-full sm:w-1/2 md:w-1/2 lg:w-1/3"
          chartData={Array.from(thesisTypes.entries()).map(
            ([thesisType, count]) => ({
              thesisType,
              count,
            })
          )}
          dataKeys={Array.from(thesisTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([thesisType]) => thesisType)}
        />
      </div>
      <div className="w-full flex flex-col pt-8">
        <h2 className="font-bold px-4 text-xl">Son 10 Tez</h2>
        <ThesisRowList
          data={lastThesesRes}
          className="w-full flex flex-col px-3 pt-4"
          classNameRow="first-of-type:border-t last-of-type:border-b"
          disableUniversityLink
        />
      </div>
      <GoBackBar
        buttonText="Geri Dön"
        defaultPath={universitiesRoute}
        className="justify-center pt-5 sm:pt-6 px-1.5"
      />
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
    <div className="flex items-center gap-1 leading-tight pr-3 text-muted-foreground">
      <Icon className="inline size-4 shrink-0" />
      <p className="font-bold shrink min-w-0">
        {value.toLocaleString(locale)}
        <span className="font-medium"> {label}</span>
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
  const titleSuffix = `Üniversite | ${siteTitle}`;
  const parsedName = decodeURIComponent(name);
  const notFoundTitle = `Üniversite Bulunamadı | ${titleSuffix}`;
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
  const {
    universityStats,
    subjects,
    languages,
    minYear,
    maxYear,
    thesesCount,
  } = await cachedGetPageData({ name: parsedName });
  const title = `${parsedName} Tez İstatistikleri | ${titleSuffix}`;
  const description = `${parsedName} bünyesinde ${minYear}-${maxYear} yılları arasında ${subjects.size.toLocaleString(
    locale
  )} farklı konuda toplam ${thesesCount.toLocaleString(
    locale
  )} tez üretilmiş. ${languages.size.toLocaleString(
    locale
  )} farklı dil ve ${universityStats.keyword_count_turkish.toLocaleString(
    locale
  )} farklı anahtar kelime kullanılmış.`;

  return {
    title,
    description,
    twitter: getTwitterMeta({
      title,
      description,
    }),
  };
}
