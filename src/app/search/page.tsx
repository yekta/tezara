import SearchBox from "@/components/search-box";

export default async function Page() {
  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-7xl px-4 md:px-8 flex-1 flex flex-col items-center pb-[calc(6vh+2rem)]">
        <div className="w-full flex flex-col items-center">
          <SearchBox variant="search" />
          <p className="text-lg text-center text-muted-foreground mt-4">
            Sonuçlar burada görünecek.
          </p>
        </div>
      </div>
    </div>
  );
}
