import GoBackBar from "@/app/theses/[id]/go-back-bar";
import { universitiesRoute } from "@/app/universities/_components/constants";
import LanguagesChart from "@/app/universities/[name]/_components/languages-chart";
import PopularSubjectsChart from "@/app/universities/[name]/_components/popular-subjects-chart";
import ThesesCountsByYearsChart from "@/app/universities/[name]/_components/theses-counts-by-years-chart";
import ThesisTypesChart from "@/app/universities/[name]/_components/thesis-types-chart";
import { cachedGetPageData } from "@/app/universities/[name]/helpers";
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
import { notFound } from "next/navigation";
import { FC } from "react";
import Highlighted from "@/components/highlighted";
import Chip from "@/components/chip";
import { LinkButton } from "@/components/ui/button";
import { searchRoute } from "@/components/search/constants";
import { SearchIcon } from "@/components/icons/search-icon";

type Props = {
  params: Promise<{ name: string }>;
};

const locale = "tr";

export default async function Page({ params }: Props) {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);

  let res: Awaited<ReturnType<typeof cachedGetPageData>> | null = null;

  try {
    res = await cachedGetPageData({ name: parsedName });
  } catch (error) {
    console.log(error);
  }

  if (!res) {
    return notFound();
  }

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
  } = res;

  if (!universityStats) {
    return notFound();
  }

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
          <Chip className="my-0.5">
            {minYear}-{maxYear}
          </Chip>
        </div>
        <div className="w-full flex flex-wrap items-center pt-3 md:pt-2.5 gap-1.5">
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
        <Highlighted>{parsedName}</Highlighted> bünyesinde,{" "}
        <Highlighted>{`${minYear}-${maxYear}`}</Highlighted> yılları arasında{" "}
        <Highlighted>{subjects.size}</Highlighted> farklı konuda toplam{" "}
        <Highlighted>{thesesCount}</Highlighted> tez yazılmıştır. Yazarlar
        tarafından <Highlighted>{languages.size}</Highlighted> farklı dil ve{" "}
        <Highlighted>{universityStats.keyword_count_turkish}</Highlighted>{" "}
        farklı anahtar kelime kullanılmıştır. En çok tez{" "}
        <Highlighted>{`${maxThesisYear.year}`}</Highlighted> yılında (
        <Highlighted>{maxThesisYear.count}</Highlighted> tez), en az tez ise{" "}
        <Highlighted>{`${minThesisYear.year}`}</Highlighted> yılında yazılmıştır
        (<Highlighted>{minThesisYear.count}</Highlighted> tez).{" "}
        {popularSubjectsChartData && popularSubjectsChartData.length > 0 && (
          <>
            Yazarlar tarafından en çok tercih edilen konu {'"'}
            <Highlighted>{popularSubjectsChartData[0].keyword}</Highlighted>
            {'"'} iken (
            <Highlighted>{popularSubjectsChartData[0].count}</Highlighted> tez),
            en çok tercih edilen tez türü ise{" "}
            <Highlighted>
              {mostPopularThesisType.thesis_type.toLowerCase()}
            </Highlighted>{" "}
            tezidir (<Highlighted>{mostPopularThesisType.count}</Highlighted>{" "}
            tez).
          </>
        )}
      </p>
      <ThesesCountsByYearsChart
        name={parsedName}
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
      <div className="w-full flex flex-col pt-10">
        <div className="w-full flex flex-wrap items-center justify-start px-4 gap-2">
          <h2 className="font-bold text-xl pr-2.5">
            {parsedName} Bünyesinde Yapılan Son 10 Tez
          </h2>
          <LinkButton
            href={`${searchRoute}?universities=${encodeURIComponent(
              parsedName
            )}`}
            className="py-2.25 px-4.5 gap-2 -ml-0.5"
          >
            <SearchIcon className="size-5 -ml-1.75" />
            <span className="flex shrink min-w-0">Tümünü Ara</span>
          </LinkButton>
        </div>
        <ThesisRowList
          disableUniversityLink
          data={lastThesesRes}
          className="w-full flex flex-col px-3 pt-4"
          classNameRow="first-of-type:border-t last-of-type:border-b"
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
  const titleSuffix = `Üniversiteler | ${siteTitle}`;
  const parsedName = decodeURIComponent(name);
  const notFoundTitle = `Üniversite Bulunamadı | ${titleSuffix}`;
  const notFoundDescription = `Bu üniversite ${siteTitle} platformunda mevcut değil.`;
  const notFoundResult = {
    title: notFoundTitle,
    description: notFoundDescription,
    twitter: getTwitterMeta({
      title: notFoundTitle,
      description: notFoundDescription,
    }),
  };
  if (!name) {
    return notFoundResult;
  }

  const locale = "tr";
  let res: Awaited<ReturnType<typeof cachedGetPageData>> | null = null;

  try {
    res = await cachedGetPageData({ name: parsedName });
  } catch (error) {
    console.log(error);
  }

  if (!res) {
    return notFoundResult;
  }

  const {
    universityStats,
    subjects,
    languages,
    minYear,
    maxYear,
    thesesCount,
  } = res;

  const title = `${parsedName} Tez İstatistikleri | ${titleSuffix}`;
  const description = `${parsedName} bünyesinde ${minYear}-${maxYear} yılları arasında ${subjects.size.toLocaleString(
    locale
  )} farklı konuda toplam ${thesesCount.toLocaleString(
    locale
  )} tez yazılmıştır. ${languages.size.toLocaleString(
    locale
  )} farklı dil ve ${universityStats.keyword_count_turkish.toLocaleString(
    locale
  )} farklı anahtar kelime kullanılmıştır.`;

  return {
    title,
    description,
    twitter: getTwitterMeta({
      title,
      description,
    }),
  };
}
