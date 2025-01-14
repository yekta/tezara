import { siteTitle } from "@/lib/constants";
import { apiServerStatic } from "@/server/trpc/setup/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Tez ${id} | ${siteTitle}`,
    description: `${id} numaralı tezi ${siteTitle} üzerinde incele.`,
  };
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const result = await apiServerStatic.main.getThesis({ id: Number(id) });
  if (!result) {
    return notFound();
  }
  const noAbstractText = "Özet yok.";
  const noTranslatedAbstractText = "Özet çevirisi yok.";
  return (
    <div className="w-full flex flex-col items-center text-lg">
      <div className="w-full max-w-2xl flex flex-col px-5 pt-4 pb-16">
        <h1 id="title" className="font-bold text-2xl leading-tight">
          {result?.language.name === "Türkçe"
            ? result.titleTurkish
            : result.titleForeign}
        </h1>
        <h2
          id="title_translated"
          className="font-semibold text-lg text-muted-foreground leading-snug mt-2"
        >
          {result?.language.name === "Türkçe"
            ? result.titleForeign
            : result.titleTurkish}
        </h2>
        <div className="w-full mt-6 mb-3 h-px rounded-full bg-border" />
        <p id="author" className="leading-snug">
          <span className="font-medium text-muted-foreground">Yazar: </span>
          <span className="font-bold" id="author_name">
            {result.author.name}
          </span>
        </p>
        <div className="w-full my-3 h-px rounded-full bg-border" />
        <p id="advisors" className="leading-snug">
          <span className="font-medium text-muted-foreground">
            Danışmanlar:{" "}
          </span>
          <span className="font-bold" id="advisors_names">
            {result.thesisAdvisors.length < 1
              ? "Bulunamadı"
              : result.thesisAdvisors
                  .map((advisor) => advisor.advisor.name)
                  .join(", ")}
          </span>
        </p>
        <div className="w-full my-3 h-px rounded-full bg-border" />
        <p id="year" className="leading-snug">
          <span className="font-medium text-muted-foreground">Yıl: </span>
          <span className="font-bold">{result.year}</span>
        </p>
        <div className="w-full my-3 h-px rounded-full bg-border" />
        <div id="abstract_section" className="mt-6">
          <p className="font-bold">Özet</p>
          <p id="abstract" className="mt-1">
            {result?.language.name === "Türkçe"
              ? result.abstractTurkish || noAbstractText
              : result.abstractForeign || noAbstractText}
          </p>
        </div>
        <div id="abstract_translated_section" className="mt-6">
          <p className="font-bold">Özet (Çeviri)</p>
          <p id="abstract_translated" className="mt-1">
            {result?.language.name === "Türkçe"
              ? result.abstractForeign || noTranslatedAbstractText
              : result.abstractTurkish || noTranslatedAbstractText}
          </p>
        </div>
      </div>
    </div>
  );
}
