import Logo from "@/components/logo/logo";
import SearchBox from "@/components/search/search-input";

export default async function Home() {
  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-7xl px-4 md:px-8 flex-1 flex flex-col justify-center items-center pt-4 pb-[calc(10vh+2rem)]">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-center px-4">
            <Logo variant="full" className="w-32 max-w-full h-auto" />
          </div>
          <SearchBox className="mt-6" variant="home" />
        </div>
      </div>
    </div>
  );
}
