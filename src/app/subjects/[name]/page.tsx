import LanguagesChart from "@/app/subjects/[name]/_components/languages-chart";
import ThesesCountsByYearsChart from "@/app/subjects/[name]/_components/theses-counts-by-years-chart";
import ThesisTypesChart from "@/app/subjects/[name]/_components/thesis-types-chart";
import { cachedGetPageData } from "@/app/subjects/[name]/helpers";
import { subjectsRoute } from "@/app/subjects/_components/constants";
import GoBackBar from "@/app/theses/[id]/go-back-bar";
import Chip from "@/components/chip";
import Highlighted from "@/components/highlighted";
import LandmarkIcon from "@/components/icons/landmark";
import PenToolIcon from "@/components/icons/pen-tool";
import SearchAllLinkButton from "@/components/search-all-link-button";
import { searchRoute } from "@/components/search/constants";
import ThesisRowList from "@/components/search/results/thesis-row-list";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getSubjects } from "@/server/meili/repo/subject";
import { GlobeIcon, ScrollTextIcon } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { FC } from "react";

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
    subjectStat,
    minYear,
    maxYear,
    thesesCountsByYearsChartData,
    thesisTypes,
    lastThesesRes,
    maxThesisYear,
    minThesisYear,
    mostPopularThesisType,
  } = res;

  if (!subjectStat) {
    return notFound();
  }

  return (
    <main className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-2 md:pt-0 md:px-8 pb-32">
      <GoBackBar
        className="justify-start px-1.5"
        defaultPath={subjectsRoute}
        buttonText="Geri Dön"
      />
      {/* Title */}
      <div className="w-full flex flex-col px-4 pt-3">
        <div className="w-full flex items-center flex-wrap gap-1.5">
          <h1 className="shrink min-w-0 font-bold text-3xl text-balance leading-tight pr-1">
            {parsedName} Konulu Tezlerin İstatistikleri
          </h1>
          <Chip className="my-0.5">
            {minYear}-{maxYear}
          </Chip>
        </div>
        <div className="w-full flex flex-wrap items-center pt-3 md:pt-2.5 gap-1.5">
          <Stat
            value={subjectStat.thesis_count}
            label="Tez"
            Icon={ScrollTextIcon}
          />
          <Stat
            value={subjectStat.university_count}
            label="Üniversite"
            Icon={LandmarkIcon}
          />
          <Stat
            value={subjectStat.language_count}
            label="Dil"
            Icon={GlobeIcon}
          />
          <Stat
            value={subjectStat.author_count}
            label="Yazar"
            Icon={PenToolIcon}
          />
        </div>
      </div>
      <p className="w-full px-4 mt-7 leading-relaxed text-base md:text-lg">
        <Highlighted>{parsedName}</Highlighted> konusunda,{" "}
        <Highlighted>{`${minYear}-${maxYear}`}</Highlighted> yılları arasında{" "}
        <Highlighted>{subjectStat.author_count}</Highlighted> yazar tarafından
        toplam <Highlighted>{thesesCount}</Highlighted> tez yazılmıştır. Bu
        tezler <Highlighted>{subjectStat.university_count}</Highlighted> farklı
        üniversite bünyesinde,{" "}
        <Highlighted>{subjectStat.language_count}</Highlighted> farklı dil ve{" "}
        <Highlighted>{subjectStat.keyword_count_turkish}</Highlighted> farklı
        anahtar kelime kullanılarak üretilmiştir.{" "}
        <Highlighted>{parsedName}</Highlighted> konusunda en çok tez{" "}
        <Highlighted>{`${maxThesisYear.year}`}</Highlighted> yılında (
        <Highlighted>{maxThesisYear.count}</Highlighted> tez), en az tez ise{" "}
        <Highlighted>{`${minThesisYear.year}`}</Highlighted> yılında yazılmıştır
        (<Highlighted>{minThesisYear.count}</Highlighted> tez). Bu konuyu
        çalışan yazarların en çok tercih ettiği tez türü{" "}
        <Highlighted>
          {mostPopularThesisType.thesis_type.toLowerCase()}
        </Highlighted>{" "}
        tezidir (<Highlighted>{mostPopularThesisType.count}</Highlighted> tez).
      </p>
      <ThesesCountsByYearsChart
        subjectName={parsedName}
        className="pt-8"
        chartData={thesesCountsByYearsChartData}
        dataKeys={Array.from(thesisTypes)
          .sort((a, b) => b[1] - a[1])
          .map(([thesisType]) => thesisType)}
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
            {parsedName} Konulu Son 10 Tez
          </h2>
          <SearchAllLinkButton
            variant="subjects"
            href={`${searchRoute}?subjects=${encodeURIComponent(parsedName)}`}
            className="-ml-0.5"
            filters={{ subjects: [parsedName] }}
          />
        </div>
        <ThesisRowList
          disableSubjectLink
          data={lastThesesRes}
          className="w-full flex flex-col px-3 pt-4"
          classNameRow="first-of-type:border-t last-of-type:border-b"
        />
      </div>
      <GoBackBar
        buttonText="Geri Dön"
        defaultPath={subjectsRoute}
        className="justify-center pt-5 sm:pt-6 px-1.5"
      />
    </main>
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
  const data = await getSubjects({
    languages: ["Turkish"],
    client: meiliAdmin,
  });
  return data.hits.map((u) => ({
    name: u.name,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const titleSuffix = `Konular | ${siteTitle}`;
  const parsedName = decodeURIComponent(name);
  const notFoundTitle = `Konu Bulunamadı | ${titleSuffix}`;
  const notFoundDescription = `Bu konu ${siteTitle} platformunda mevcut değil.`;
  const notFoundResult = {
    title: notFoundTitle,
    description: notFoundDescription,
    twitter: getTwitterMeta({
      title: notFoundTitle,
      description: notFoundDescription,
      addImages: true,
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

  const { subjectStat, minYear, maxYear, thesesCount } = res;

  const title = `${parsedName} Konulu Tezlerin İstatistikleri | ${titleSuffix}`;
  const description = `${parsedName} konusunda, ${minYear}-${maxYear} yılları arasında ${subjectStat.author_count.toLocaleString(
    locale
  )} yazar tarafından toplam ${thesesCount.toLocaleString(
    locale
  )} tez yazılmıştır. Bu tezler ${subjectStat.university_count.toLocaleString(
    locale
  )} farklı üniversite bünyesinde, ${
    subjectStat.language_count
  } farklı dil ve ${subjectStat.keyword_count_turkish.toLocaleString(
    locale
  )} farklı anahtar kelime kullanılarak üretilmiştir.`;

  return {
    title,
    description,
    twitter: getTwitterMeta({
      title,
      description,
      addImages: true,
    }),
  };
}
