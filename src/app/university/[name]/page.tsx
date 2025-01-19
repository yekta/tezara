import PopularSubjectsChart from "@/app/university/[name]/_components/popular-subjects-chart";
import ThesesCountsByYearsChart from "@/app/university/[name]/_components/theses-counts-by-years-chart";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { meiliAdmin } from "@/server/meili/constants-server";
import { searchTheses } from "@/server/meili/repo/thesis";
import {
  FolderClosedIcon,
  GlobeIcon,
  KeyRoundIcon,
  ScrollTextIcon,
} from "lucide-react";
import { Metadata } from "next";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function Page({ params }: Props) {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);

  const res = await searchTheses({
    client: meiliAdmin,
    hitsPerPage: 100_000,
    universities: [parsedName],
    page: 1,
    languages: undefined,
    query: undefined,
    sort: undefined,
    thesisTypes: undefined,
    yearGte: undefined,
    yearLte: undefined,
    attributesToRetrieve: [
      "year",
      "language",
      "thesis_type",
      "keywords_turkish",
      "keywords_english",
      "subjects_english",
      "subjects_turkish",
    ],
  });

  const keywords = new Set<string>();
  const languages = new Set<string>();
  const subjects = new Map<string, number>();

  const thesesCountsByYears: Record<string, Record<string, number>> = {};
  res.hits.forEach((hit) => {
    if (hit.keywords_turkish) {
      hit.keywords_turkish.forEach((keyword) => {
        keywords.add(keyword);
      });
    }
    if (hit.keywords_english) {
      hit.keywords_english.forEach((keyword) => {
        keywords.add(keyword);
      });
    }
    if (hit.subjects_turkish) {
      hit.subjects_turkish.forEach((subject) => {
        const count = subjects.get(subject) || 0;
        subjects.set(subject, count + 1);
      });
    }
    if (hit.language) {
      languages.add(hit.language);
    }
    const year = hit.year || "Bilinmiyor";
    const thesisType = hit.thesis_type || "Diğer";
    if (!thesesCountsByYears[year]) {
      thesesCountsByYears[year] = {};
    }
    if (!thesesCountsByYears[year][thesisType]) {
      thesesCountsByYears[year] = {
        ...thesesCountsByYears[year],
        [thesisType]: 1,
      };
    }
    thesesCountsByYears[year][thesisType] += 1;
  });

  const years = Object.keys(thesesCountsByYears).map(Number);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const allThesisTypes = new Set<string>();
  Object.values(thesesCountsByYears).forEach((thesesCount) => {
    Object.keys(thesesCount).forEach((thesisType) => {
      allThesisTypes.add(thesisType);
    });
  });
  const thesisTypes = Array.from(allThesisTypes);

  const thesesCountsByYearsChartData: { [key: string]: string }[] = Array.from(
    { length: maxYear - minYear + 1 },
    (_, index) => {
      const year = String(minYear + index);
      const rest = thesesCountsByYears[year] || {};
      return {
        year,
        ...rest,
      };
    }
  );

  const popularSubjectsChartData = Array.from(subjects.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-2 md:pt-0 md:px-8 pb-32">
      {/* Title */}
      <div className="w-full flex flex-col px-4">
        <h1 className="w-full font-bold text-2xl text-balance leading-tight flex items-center gap-1">
          <span className="pr-1">{parsedName} </span>
          <span className="bg-foreground/10 border border-foreground/20 rounded-full font-medium text-sm px-2 py-0.25">
            {minYear}-{maxYear}
          </span>
        </h1>
        <h2 className="font-medium text-base mt-2 lead ing-tight text-muted-foreground">
          <ScrollTextIcon className="inline size-4 text-foreground mr-1 -mt-0.5" />
          <span className="font-semibold text-foreground">
            {res.hits.length.toLocaleString()}
          </span>{" "}
          Tez
          <span className="text-foreground/30 px-[0.75ch]">|</span>
          <GlobeIcon className="inline size-4 text-foreground mr-1 -mt-0.5" />
          <span className="font-semibold text-foreground">
            {languages.size.toLocaleString()}
          </span>{" "}
          Dil
          <span className="text-foreground/30 px-[0.75ch]">|</span>
          <FolderClosedIcon className="inline size-4 text-foreground mr-1 -mt-0.5" />
          <span className="font-semibold text-foreground">
            {subjects.size.toLocaleString()}
          </span>{" "}
          Konu
          <span className="text-foreground/30 px-[0.75ch]">|</span>
          <KeyRoundIcon className="inline size-4 text-foreground mr-1 -mt-0.5" />
          <span className="font-semibold text-foreground">
            {keywords.size.toLocaleString()}
          </span>{" "}
          Anahtar Kelime
        </h2>
      </div>
      <ThesesCountsByYearsChart
        className="mt-6"
        chartData={thesesCountsByYearsChartData}
        dataKeys={thesisTypes}
      />
      <PopularSubjectsChart
        className="mt-6"
        chartData={popularSubjectsChartData}
        dataKeys={popularSubjectsChartData.map((data) => data.keyword)}
      />
    </div>
  );
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

  const title = `${parsedName} | ${siteTitle}`;
  const description = truncateDescription(
    `${parsedName} öğrencileri tarafından yapılmış tezleri incele.`
  );

  return {
    title,
    description,
    twitter: getTwitterMeta({
      title,
      description,
    }),
  };
}

const maxDescriptionLength = 160;

function truncateDescription(description: string) {
  return description.length > maxDescriptionLength
    ? description.slice(0, maxDescriptionLength) + "..."
    : description;
}
