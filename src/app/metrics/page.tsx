import RefreshedAt from "@/app/metrics/_components/refreshed-at";
import { SearchIcon } from "@/components/icons/search-icon";
import { cn } from "@/components/ui/utils";
import { siteTitle } from "@/lib/constants";
import { env } from "@/lib/env";
import { getTwitterMeta } from "@/lib/helpers";
import { FileTextIcon, UserIcon, UserSearchIcon } from "lucide-react";
import { Metadata } from "next";
import { unstable_cacheLife as cacheLife } from "next/cache";
import { FC } from "react";

type TInterval = "24h" | "30d" | "alltime";
type Card = {
  key: string;
  title: string;
  Icon: FC<{ className?: string }>;
  interval: TInterval;
};

const cards: Card[] = [
  // Last 24 hours
  {
    key: "pageviews_total_24h",
    title: "Sayfa Görüntüleme",
    Icon: FileTextIcon,
    interval: "24h",
  },
  {
    key: "pageviews_unique_24h",
    title: "Tekil Ziyaretçi",
    Icon: UserIcon,
    interval: "24h",
  },
  {
    key: "searched_total_24h",
    title: "Arama (Toplam)",
    Icon: SearchIcon,
    interval: "24h",
  },
  {
    key: "searched_unique_24h",
    title: "Arama (Tekil Ziyaretçi)",
    Icon: UserSearchIcon,
    interval: "24h",
  },
  // Last 30 days
  {
    key: "pageviews_total_30d",
    title: "Sayfa Görüntüleme",
    Icon: FileTextIcon,
    interval: "30d",
  },
  {
    key: "pageviews_unique_30d",
    title: "Tekil Ziyaretçi",
    Icon: UserIcon,
    interval: "30d",
  },
  {
    key: "searched_total_30d",
    title: "Arama (Toplam)",
    Icon: SearchIcon,
    interval: "30d",
  },
  {
    key: "searched_unique_30d",
    title: "Arama (Tekil Ziyaretçi)",
    Icon: UserSearchIcon,
    interval: "30d",
  },
  // All-time
  {
    key: "pageviews_total_alltime",
    title: "Sayfa Görüntüleme",
    Icon: FileTextIcon,
    interval: "alltime",
  },
  {
    key: "pageviews_unique_alltime",
    title: "Tekil Ziyaretçi",
    Icon: UserIcon,
    interval: "alltime",
  },
  {
    key: "searched_total_alltime",
    title: "Arama (Toplam)",
    Icon: SearchIcon,
    interval: "alltime",
  },
  {
    key: "searched_unique_alltime",
    title: "Arama (Tekil Ziyaretçi)",
    Icon: UserSearchIcon,
    interval: "alltime",
  },
];

export default async function Page() {
  "use cache";
  cacheLife("default");

  const { results, lastRefresh } = await getStats();
  return (
    <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 content-start pt-2 md:px-8 pb-32">
      <div className="w-full flex flex-col">
        <h1 className="px-4 w-full font-bold text-3xl text-balance leading-tight">
          Kullanım Metrikleri
        </h1>
        <RefreshedAt timestamp={lastRefresh.getTime()} />
      </div>
      <Section
        title="Son 24 Saat"
        interval="24h"
        results={results}
        className="pt-6"
      />
      <Section title="Son 30 Gün" interval="30d" results={results} />
      <Section title="Tüm Zamanlar" interval="alltime" results={results} />
    </div>
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
    <div id={interval} className={cn("w-full pt-8 flex flex-col", className)}>
      <h2 className="px-4 w-full min-w-0 font-bold text-xl text-balance leading-tight">
        {title}
      </h2>
      <ul className="w-full flex flex-row flex-wrap content-stretch pt-2 px-1">
        {cards
          .filter(
            (c) =>
              c.interval === interval && results.some(([key]) => key === c.key)
          )
          .map((c) => {
            const count = results.find(([key]) => key === c.key)?.[1];
            if (count === undefined) return null;
            return (
              <Card key={c.key} title={c.title} count={count} Icon={c.Icon} />
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
}: {
  title: string;
  Icon: FC<{ className?: string }>;
  count: number;
}) {
  return (
    <li className="w-full flex flex-col sm:w-1/2 lg:w-1/4 p-1">
      <div className="w-full flex-1 border rounded-xl flex flex-col items-center px-4 py-3">
        <div className="w-full flex items-center justify-center gap-1 text-muted-foreground">
          <Icon className="size-4 -ml-0.5 shrink-0" />
          <h3 className="font-medium whitespace-nowrap overflow-hidden overflow-ellipsis shrink min-w-0 text-sm leading-tight">
            {title}
          </h3>
        </div>
        <p className="w-full px-2 font-bold text-2xl py-6 text-center leading-tight">
          {count.toLocaleString("tr-TR")}
        </p>
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

async function getStats() {
  const posthogUrl = `https://us.posthog.com/api/projects/${env.POSTHOG_PROJECT_ID}/query/`;
  const posthogHeaders = {
    Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
    "Content-Type": "application/json",
  };
  const payload = {
    query: {
      kind: "HogQLQuery",
      query: `
      SELECT 
          'pageviews_unique_24h' AS time_range, 
          count(DISTINCT distinct_id) AS count
      FROM events
      WHERE event = '$pageview'
          AND timestamp > now() - INTERVAL 24 HOUR
      UNION ALL
      SELECT 
          'pageviews_unique_30d' AS time_range, 
          count(DISTINCT distinct_id) AS count
      FROM events
      WHERE event = '$pageview'
          AND timestamp > now() - INTERVAL 30 DAY
      UNION ALL
      SELECT 
          'pageviews_unique_alltime' AS time_range, 
          count(DISTINCT distinct_id) AS count
      FROM events
      WHERE event = '$pageview'
      UNION ALL
      SELECT 
          'pageviews_total_24h' AS time_range, 
          count(*) AS count
      FROM events
      WHERE event = '$pageview'
          AND timestamp > now() - INTERVAL 24 HOUR
      UNION ALL
      SELECT 
          'pageviews_total_30d' AS time_range, 
          count(*) AS count
      FROM events
      WHERE event = '$pageview'
          AND timestamp > now() - INTERVAL 30 DAY
      UNION ALL
      SELECT 
          'pageviews_total_alltime' AS time_range, 
          count(*) AS count
      FROM events
      WHERE event = '$pageview'
      UNION ALL
      SELECT 
          'searched_unique_24h' AS time_range, 
          count(DISTINCT distinct_id) AS count
      FROM events
      WHERE event = 'Searched'
          AND timestamp > now() - INTERVAL 24 HOUR
      UNION ALL
      SELECT 
          'searched_unique_30d' AS time_range, 
          count(DISTINCT distinct_id) AS count
      FROM events
      WHERE event = 'Searched'
          AND timestamp > now() - INTERVAL 30 DAY
      UNION ALL
      SELECT 
          'searched_unique_alltime' AS time_range, 
          count(DISTINCT distinct_id) AS count
      FROM events
      WHERE event = 'Searched'
      UNION ALL
      SELECT 
          'searched_total_24h' AS time_range, 
          count(*) AS count
      FROM events
      WHERE event = 'Searched'
          AND timestamp > now() - INTERVAL 24 HOUR
      UNION ALL
      SELECT 
          'searched_total_30d' AS time_range, 
          count(*) AS count
      FROM events
      WHERE event = 'Searched'
          AND timestamp > now() - INTERVAL 30 DAY
      UNION ALL
      SELECT 
          'searched_total_alltime' AS time_range, 
          count(*) AS count
      FROM events
      WHERE event = 'Searched'
  `,
    },
  };

  const res = await fetch(posthogUrl, {
    method: "POST",
    headers: posthogHeaders,
    body: JSON.stringify(payload),
  });
  const json: { results: [string, number][]; last_refresh: string } =
    await res.json();
  const results = json.results;
  const lastRefresh = new Date(json.last_refresh);

  return { results, lastRefresh };
}
