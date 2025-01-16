import Logo from "@/components/logo/logo";
import SearchBox from "@/components/search/search-input";
import { searchPageSearchParamsCache } from "@/components/search/search-query-params";
import { apiServer } from "@/server/trpc/setup/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  await searchPageSearchParamsCache.parse(searchParams);
  const [languages, universities, thesisTypes] = await Promise.all([
    apiServer.main.getLanguages({}),
    apiServer.main.getUniversities({}),
    apiServer.main.getThesisTypes({}),
  ]);

  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-7xl px-3 md:px-8 flex-1 flex flex-col justify-center items-center pt-4 pb-[calc(11vh+6rem)]">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-center px-4">
            <Logo variant="full" className="w-32 max-w-full h-auto" />
          </div>
          <SearchBox
            languages={languages}
            universities={universities}
            thesisTypes={thesisTypes}
            className="mt-6"
            variant="home"
          />
        </div>
      </div>
    </div>
  );
}
