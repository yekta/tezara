import Logo from "@/components/logo/logo";
import SearchBox from "@/components/search/search-box";
import { searchPageSearchParamsCache } from "@/components/search/search-query-params";
import { prefetchAdvisors } from "@/lib/queries/prefetch-advisors";
import { prefetchAuthors } from "@/lib/queries/prefetch-authors";
import { meili } from "@/server/meili/constants-client";
import { searchAdvisors } from "@/server/meili/repo/advisors";
import { getLanguages } from "@/server/meili/repo/language";
import { getThesisTypes } from "@/server/meili/repo/thesis-type";
import { getUniversities } from "@/server/meili/repo/university";
import {
  getQueryClientServer,
  HydrateClient,
} from "@/server/trpc/setup/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  await searchPageSearchParamsCache.parse(searchParams);
  const queryClient = getQueryClientServer();

  const [languages, universities, thesisTypes] = await Promise.all([
    getLanguages({ client: meili }),
    getUniversities({ client: meili }),
    getThesisTypes({ client: meili }),
    queryClient.prefetchQuery({
      queryKey: ["advisors", undefined],
      queryFn: () =>
        searchAdvisors({
          q: "",
          page: 1,
          sort: undefined,
          client: meili,
        }),
    }),
    prefetchAdvisors({ queryClient }),
    prefetchAuthors({ queryClient }),
  ]);

  return (
    <HydrateClient>
      <div className="w-full flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl px-3 md:px-8 flex-1 flex flex-col justify-center items-center pt-4 pb-[calc(11vh+6rem)]">
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-center px-4">
              <Logo variant="full" className="w-32 max-w-full h-auto" />
            </div>
            <SearchBox
              languages={languages.hits}
              universities={universities.hits}
              thesisTypes={thesisTypes.hits}
              className="mt-6"
              variant="home"
            />
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
