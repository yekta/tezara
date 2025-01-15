import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { Metadata } from "next";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function Page({ params }: Props) {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);
  return (
    <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-4">
      {/* Title */}
      <h1 id="title" className="font-bold text-2xl text-balance leading-tight">
        {parsedName}
      </h1>
      <p className="w-full flex items-center leading-tight text-center justify-center text-muted-foreground text-balance py-6">
        Bu sayfa yapım aşamasındadır.
      </p>
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
