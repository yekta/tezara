import Logo from "@/components/logo/logo";
import SearchBox from "@/components/search/search-input";
import { searchPageSearchParamsCache } from "@/components/search/search-query-params";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  await searchPageSearchParamsCache.parse(searchParams);
  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-7xl px-4 md:px-8 flex-1 flex flex-col justify-center items-center pt-4 pb-[calc(11vh+6rem)]">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-center px-4">
            <Logo variant="full" className="w-32 max-w-full h-auto" />
          </div>
          <Suspense>
            <SearchBox className="mt-6" variant="home" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
