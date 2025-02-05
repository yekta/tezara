import RefreshedAt from "@/app/metrics/_components/refreshed-at";
import BuildingIcon from "@/components/icons/building";
import CalendarIcon from "@/components/icons/calendar";
import FolderClosedIcon from "@/components/icons/folder-closed";
import GlobeIcon from "@/components/icons/globe";
import LandmarkIcon from "@/components/icons/landmark";
import PenToolIcon from "@/components/icons/pen-tool";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import { SearchIcon } from "@/components/icons/search-icon";
import { cn } from "@/components/ui/utils";
import { siteTitle } from "@/lib/constants";
import { env } from "@/lib/env";
import { getTwitterMeta } from "@/lib/helpers";
import { cacheWithRedis } from "@/server/redis/constants";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  FileTextIcon,
  InfinityIcon,
  SearchCheckIcon,
  UserIcon,
  UserSearchIcon,
} from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { FC } from "react";
import { z } from "zod";

type TInterval = "24h" | "30d" | "alltime";
type Card = {
  key: string;
  title: string;
  Icon: FC<{ className?: string }>;
  interval: TInterval;
  event: string;
  queryInterval?: {
    type: "HOUR" | "DAY";
    count: number;
  };
  distinct: boolean;
};

const cards: Card[] = [
  // Last 24 hours
  {
    key: "pageviews_total_24h",
    title: "Sayfa Görüntüleme",
    Icon: FileTextIcon,
    interval: "24h",
    event: "$pageview",
    queryInterval: { type: "HOUR", count: 24 },
    distinct: false,
  },
  {
    key: "pageviews_unique_24h",
    title: "Ziyaretçi",
    Icon: UserIcon,
    interval: "24h",
    event: "$pageview",
    queryInterval: { type: "HOUR", count: 24 },
    distinct: true,
  },
  {
    key: "searched_total_24h",
    title: "Arama (Toplam)",
    Icon: SearchIcon,
    interval: "24h",
    event: "Searched",
    queryInterval: { type: "HOUR", count: 24 },
    distinct: false,
  },
  {
    key: "searched_unique_24h",
    title: "Arama (Ziyaretçi)",
    Icon: UserSearchIcon,
    interval: "24h",
    event: "Searched",
    queryInterval: { type: "HOUR", count: 24 },
    distinct: true,
  },
  // Last 30 days
  {
    key: "pageviews_total_30d",
    title: "Sayfa Görüntüleme",
    Icon: FileTextIcon,
    interval: "30d",
    event: "$pageview",
    queryInterval: { type: "DAY", count: 30 },
    distinct: false,
  },
  {
    key: "pageviews_unique_30d",
    title: "Ziyaretçi",
    Icon: UserIcon,
    interval: "30d",
    event: "$pageview",
    queryInterval: { type: "DAY", count: 30 },
    distinct: true,
  },
  {
    key: "searched_total_30d",
    title: "Arama (Toplam)",
    Icon: SearchIcon,
    interval: "30d",
    event: "Searched",
    queryInterval: { type: "DAY", count: 30 },
    distinct: false,
  },
  {
    key: "searched_unique_30d",
    title: "Arama (Ziyaretçi)",
    Icon: UserSearchIcon,
    interval: "30d",
    event: "Searched",
    queryInterval: { type: "DAY", count: 30 },
    distinct: true,
  },
  // All-time
  {
    key: "pageviews_total_alltime",
    title: "Sayfa Görüntüleme",
    Icon: FileTextIcon,
    interval: "alltime",
    event: "$pageview",
    distinct: false,
  },
  {
    key: "pageviews_unique_alltime",
    title: "Ziyaretçi",
    Icon: UserIcon,
    interval: "alltime",
    event: "$pageview",
    distinct: true,
  },
  {
    key: "searched_total_alltime",
    title: "Arama (Toplam)",
    Icon: SearchIcon,
    interval: "alltime",
    event: "Searched",
    distinct: false,
  },
  {
    key: "searched_unique_alltime",
    title: "Arama (Ziyaretçi)",
    Icon: UserSearchIcon,
    interval: "alltime",
    event: "Searched",
    distinct: true,
  },
];

const getStatsCached = cacheWithRedis("metrics", getStats, "short");

export default async function Page() {
  await headers();
  const { results, last_refresh } = await getStatsCached();
  const lastRefreshDate = new Date(last_refresh);

  return (
    <main className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 content-start pt-2 md:px-8 pb-32">
      <div className="w-full flex flex-col">
        <h1 className="px-4 w-full font-bold text-3xl text-balance leading-tight">
          Kullanım Metrikleri
        </h1>
        <RefreshedAt timestamp={lastRefreshDate.getTime()} />
      </div>
      <Section title="Son 24 Saat" interval="24h" results={results} />
      <Section title="Son 30 Gün" interval="30d" results={results} />
      <Section title="Tüm Zamanlar" interval="alltime" results={results} />
      {results.some(([key]) => key.startsWith(filterSeparator)) && (
        <div id="popular_filters" className="w-full pt-6 flex flex-col">
          <h2 className="px-4 w-full min-w-0 font-bold text-xl text-balance leading-tight">
            Popüler Filtreler
          </h2>
          <ul className="w-full flex flex-row flex-wrap content-stretch pt-3 px-3 gap-1.5">
            {results
              .filter((c) => c[0].startsWith(filterSeparator))
              .map((c) => {
                const count = c[1];
                const key = c[0].replace(filterSeparator, "");
                const obj = filterMap[key];
                if (!obj) return null;
                if (count < 20) return null;
                return (
                  <li
                    key={key}
                    className="px-3 py-2.5 border leading-tight rounded-xl gap-1.25 shrink min-w-0 flex items-center text-foreground"
                  >
                    <div className="shrink pl-0.25 gap-1 min-w-0 flex items-center justify-center">
                      <obj.Icon className="size-4 shrink-0 text-muted-foreground" />
                      <p className="text-muted-foreground leading-none font-medium text-sm">
                        {obj.title}:
                      </p>
                    </div>
                    <p className="font-bold shrink min-w-0 leading-none text-lg">
                      {count}
                    </p>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  interval,
  results,
  className,
}: {
  title: string;
  interval: TInterval;
  results: [string, number][];
  className?: string;
}) {
  return (
    <div id={interval} className={cn("w-full pt-6 flex flex-col", className)}>
      <h2 className="px-4 w-full min-w-0 font-bold text-xl text-balance leading-tight">
        {title}
      </h2>
      <ul className="w-full flex flex-row flex-wrap content-stretch pt-2 px-2">
        {cards
          .filter(
            (c) =>
              c.interval === interval && results.some(([key]) => key === c.key)
          )
          .map((c) => {
            const count = results.find(([key]) => key === c.key)?.[1];
            if (count === undefined) return null;
            const prev = results.find(([key]) => key === `${c.key}_prev`)?.[1];
            const change = prev ? (count - prev) / prev : undefined;

            return (
              <Card
                key={c.key}
                title={c.title}
                count={count}
                Icon={c.Icon}
                change={change}
              />
            );
          })}
      </ul>
    </div>
  );
}

function Card({
  title,
  Icon,
  count,
  change,
}: {
  title: string;
  Icon: FC<{ className?: string }>;
  count: number;
  change?: number;
}) {
  const changeRounded =
    change !== undefined ? Math.round(change * 100) : undefined;
  const changeRoundedAbs =
    changeRounded !== undefined ? Math.abs(changeRounded) : undefined;

  return (
    <li className="w-full flex flex-col sm:w-1/2 lg:w-1/4 p-1">
      <div className="w-full flex-1 border rounded-xl flex flex-col items-center px-4 py-3">
        <div className="w-full flex items-center justify-center gap-1 text-muted-foreground">
          <Icon className="size-4 -ml-0.5 shrink-0" />
          <h3 className="font-medium whitespace-nowrap overflow-hidden overflow-ellipsis shrink min-w-0 text-sm leading-tight">
            {title}
          </h3>
        </div>
        <div
          data-has-change={changeRounded !== undefined ? true : undefined}
          className="w-full flex flex-col items-center justify-center px-2 gap-1 pt-3 pb-2.5"
        >
          <p className="w-full font-bold text-2xl text-center leading-tight">
            {count.toLocaleString("tr-TR")}
          </p>
          <div
            className="max-w-full min-w-0 rounded-full overflow-hidden flex items-center justify-center py-0.5 px-1.75
            text-foreground bg-foreground/10
            data-[type=negative]:text-destructive data-[type=negative]:bg-destructive/12
            data-[type=positive]:text-success data-[type=positive]:bg-success/12"
            data-type={
              changeRounded === undefined || changeRounded > 0
                ? "positive"
                : changeRounded < 0
                ? "negative"
                : undefined
            }
          >
            {changeRounded !== undefined && changeRounded === 0 ? (
              <ArrowRightIcon className="size-3.5 shrink-0 -ml-0.75" />
            ) : changeRounded !== undefined && changeRounded < 0 ? (
              <ArrowDownIcon className="size-3.5 shrink-0 -ml-0.75" />
            ) : (
              <ArrowUpIcon className="size-3.5 shrink-0 -ml-0.75" />
            )}
            {changeRoundedAbs !== undefined ? (
              <p className="font-semibold min-w-0 shrink overflow-hidden whitespace-nowrap overflow-ellipsis text-xs leading-tight">
                %{changeRoundedAbs}
              </p>
            ) : (
              <InfinityIcon className="size-3.5 shrink-0" />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

const title = `Kullanım Metrikleri | ${siteTitle}`;
const description =
  "Tezara platformunun kullanım metriklerini görüntüle. Ziyaretçi sayısı, arama sayısı, en çok kullanılan filtreler ve daha fazlası.";

export const metadata: Metadata = {
  title,
  description,
  twitter: getTwitterMeta({
    title,
    description,
  }),
};

const filterSeparator = "|Filter|";
const filterMap: Record<
  string,
  { title: string; Icon: FC<{ className?: string }> }
> = {
  Subjects: {
    title: "Konu",
    Icon: FolderClosedIcon,
  },
  Departments: {
    title: "Ana Bilim Dalı",
    Icon: BuildingIcon,
  },
  Languages: {
    title: "Dil",
    Icon: GlobeIcon,
  },
  "Thesis Types": {
    title: "Tez Türü",
    Icon: ScrollTextIcon,
  },
  Universities: {
    title: "Üniversite",
    Icon: LandmarkIcon,
  },
  Years: {
    title: "Yıl",
    Icon: CalendarIcon,
  },
  Advisors: {
    title: "Danışman",
    Icon: UserIcon,
  },
  "Search On": {
    title: "Arama Alanı",
    Icon: SearchCheckIcon,
  },
  Authors: {
    title: "Yazar",
    Icon: PenToolIcon,
  },
};

async function getStats() {
  const posthogUrl = `https://us.posthog.com/api/projects/${env.POSTHOG_PROJECT_ID}/query/`;
  const posthogHeaders = {
    Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
    "Content-Type": "application/json",
  };
  const filtersQuery = `
    SELECT 
        concat('|Filter|', properties['Filter Type']) AS key,
        count(uuid) AS count,
    FROM events
    WHERE event = 'Filtered'
    GROUP BY key
    ORDER BY count DESC
  `;
  const queries = cards.map(({ key, event, distinct, queryInterval }) => {
    const and = queryInterval
      ? ` AND timestamp > now() - INTERVAL ${queryInterval.count} ${queryInterval.type}`
      : "";
    const prevAnd = queryInterval
      ? ` AND timestamp > now() - INTERVAL ${queryInterval.count * 2} ${
          queryInterval.type
        } AND timestamp < now() - INTERVAL ${queryInterval.count} ${
          queryInterval.type
        }`
      : "";
    const baseQuery = `
      SELECT 
          '${key}' AS key, 
          ${distinct ? "count(DISTINCT distinct_id)" : "count(uuid)"} AS count
      FROM events
      WHERE event = '${event}'
    `;
    const prevQuery = queryInterval
      ? `
      SELECT 
          '${key}_prev' AS key, 
          ${distinct ? "count(DISTINCT distinct_id)" : "count(uuid)"} AS count
      FROM events
      WHERE event = '${event}'
    `
      : "";
    let query = baseQuery + and;
    if (!queryInterval) return query;
    query += "\nUNION ALL\n" + prevQuery + prevAnd;
    return query;
  });

  const query = queries.join("\nUNION ALL\n") + "\nUNION ALL\n" + filtersQuery;
  const payload = {
    query: {
      kind: "HogQLQuery",
      query,
    },
  };

  const res = await fetch(posthogUrl, {
    method: "POST",
    headers: posthogHeaders,
    body: JSON.stringify(payload),
  });

  const StatsSchema = z.object({
    results: z.array(z.tuple([z.string(), z.number()])).min(1),
    last_refresh: z.string().nonempty(),
  });

  const json = await res.json();
  const parsed = StatsSchema.parse(json);

  return { results: parsed.results, last_refresh: parsed.last_refresh };
}
