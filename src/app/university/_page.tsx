import { LinkButton } from "@/components/ui/button";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getUniversities } from "@/server/meili/repo/university";
import { Metadata } from "next";

const locale = "tr";

export default async function Page() {
  const data = await getUniversities({ client: meiliAdmin });
  const universities = data.hits;

  return (
    <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-2 md:px-8 pb-32">
      {/* Title */}
      <div className="w-full flex flex-col px-4">
        <div className="w-full flex items-center flex-wrap gap-1.5">
          <h1 className="max-w-full font-bold text-3xl text-balance leading-tight pr-1">
            Üniversiteler
          </h1>
          <p className="bg-foreground/10 rounded-full font-semibold text-sm px-2.5 py-0.5">
            {data.estimatedTotalHits.toLocaleString(locale)}
          </p>
        </div>
        <div className="w-full flex flex-wrap items-center mt-3 md:mt-2 gap-1.5"></div>
      </div>
      <div className="w-full flex flex-wrap px-1 pt-3">
        {universities.map((university, index) => (
          <div
            key={`${university.name}-${index}`}
            className="w-full flex md:w-1/2 lg:w-1/3 p-1"
          >
            <LinkButton
              href={`/university/${encodeURIComponent(university.name)}`}
              variant="outline"
              className="w-full flex flex-col rounded-lg p-4 items-start justify-start"
            >
              <h3 className="w-full text-left text-balance leading-tight font-bold">
                {university.name}
              </h3>
            </LinkButton>
          </div>
        ))}
      </div>
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
