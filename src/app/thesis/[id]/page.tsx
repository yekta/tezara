import { getPreviewUrl, siteTitle } from "@/lib/constants";
import { apiServerStatic } from "@/server/trpc/setup/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const TURKISH = "Türkçe";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const thesis = await apiServerStatic.main.getThesis({ id: Number(id) });
  if (!thesis) {
    return notFound();
  }

  const noAbstractText = "Özet yok.";
  const noTranslatedAbstractText = "Özet çevirisi mevcut değil.";
  const noAdvisorText = "Danışman mevcut değil.";
  const noDepartment = "Ana bilim dalı belirtilmemiş.";
  const noBranch = "Bilim dalı belirtilmemiş.";
  const noTitle = "Başlık mevcut değil.";
  const noTranslatedTitle = "Başlık çevirisi mevcut değil.";

  return (
    <div className="w-full flex flex-col items-center text-lg">
      <div className="w-full max-w-2xl flex flex-col px-5 pt-4 pb-16">
        {/* Title */}
        <h1 id="title" className="font-bold text-2xl leading-tight">
          {thesis?.language.name === TURKISH
            ? thesis.titleTurkish
            : thesis.titleForeign || noTitle}
        </h1>
        {/* Translated title */}
        <h2
          id="title_translated"
          className="font-semibold text-lg text-muted-foreground leading-snug mt-2"
        >
          {thesis?.language.name === TURKISH
            ? thesis.titleForeign || noTranslatedTitle
            : thesis.titleTurkish || noTranslatedTitle}
        </h2>
        {/* Details */}
        <div id="details" className="w-full flex flex-col text-sm mt-6">
          <Divider />
          <p id="thesis_id" className="leading-snug">
            <span className="font-medium text-muted-foreground">Tez No: </span>
            <span className="font-bold" id="author_name">
              {thesis.id}
            </span>
          </p>
          <Divider />
          <p id="author" className="leading-snug">
            <span className="font-medium text-muted-foreground">Yazar: </span>
            <span className="font-bold" id="author_name">
              {thesis.author.name}
            </span>
          </p>
          <Divider />
          <p id="advisors" className="leading-snug">
            <span className="font-medium text-muted-foreground">
              Danışmanlar:{" "}
            </span>
            <span className="font-bold" id="advisors_names">
              {thesis.thesisAdvisors.length < 1
                ? noAdvisorText
                : thesis.thesisAdvisors
                    .map((advisor) => advisor.advisor.name)
                    .join(", ")}
            </span>
          </p>
          <Divider />
          <p id="thesis_type" className="leading-snug">
            <span className="font-medium text-muted-foreground">
              Tez Tipi:{" "}
            </span>
            <span className="font-bold" id="advisors_names">
              {thesis.type}
            </span>
          </p>
          <Divider />
          <p id="year" className="leading-snug">
            <span className="font-medium text-muted-foreground">Yıl: </span>
            <span className="font-bold">{thesis.year}</span>
          </p>
          <Divider />
          <p id="language" className="leading-snug">
            <span className="font-medium text-muted-foreground">Dil: </span>
            <span className="font-bold">{thesis.language.name}</span>
          </p>
          <Divider />
          <p id="university" className="leading-snug">
            <span className="font-medium text-muted-foreground">
              Üniversite:{" "}
            </span>
            <span className="font-bold">{thesis.university.name}</span>
          </p>
          <Divider />
          <p id="institute" className="leading-snug">
            <span className="font-medium text-muted-foreground">Enstitü: </span>
            <span className="font-bold">{thesis.institute.name}</span>
          </p>
          <Divider />
          <p id="department" className="leading-snug">
            <span className="font-medium text-muted-foreground">
              Ana Bilim Dalı:{" "}
            </span>
            <span className="font-bold">
              {thesis.department?.name || noDepartment}
            </span>
          </p>
          <Divider />
          <p id="branch" className="leading-snug">
            <span className="font-medium text-muted-foreground">
              Bilim Dalı:{" "}
            </span>
            <span className="font-bold">{thesis.branch?.name || noBranch}</span>
          </p>
          <Divider />
          <p id="page_count" className="leading-snug">
            <span className="font-medium text-muted-foreground">
              Sayfa Sayısı:{" "}
            </span>
            <span className="font-bold">{thesis.pageCount}</span>
          </p>
          <Divider />
        </div>
        {/* Abstract */}
        <div id="abstract_section" className="mt-6">
          <p className="font-bold">Özet</p>
          <p id="abstract" className="mt-1">
            {thesis?.language.name === TURKISH
              ? thesis.abstractTurkish || noAbstractText
              : thesis.abstractForeign || noAbstractText}
          </p>
        </div>
        {/* Translated abstract */}
        <div id="abstract_translated_section" className="mt-6">
          <p className="font-bold">Özet (Çeviri)</p>
          <p id="abstract_translated" className="mt-1">
            {thesis?.language.name === TURKISH
              ? thesis.abstractForeign || noTranslatedAbstractText
              : thesis.abstractTurkish || noTranslatedAbstractText}
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const thesis = await apiServerStatic.main.getThesis({ id: Number(id) });
  const notFoundTitle = `Tez Bulunamadı | ${siteTitle}`;
  const notFoundDescription = `${id} numaralı tezi ${siteTitle} platformunda mevcut değil.`;

  if (!thesis) {
    return {
      title: `Tez Bulunamadı | ${siteTitle}`,
      description: `${id} numaralı tezi ${siteTitle} platformunda mevcut değil.`,
      twitter: {
        title: notFoundTitle,
        description: notFoundDescription,
        card: "summary_large_image",
        images: [
          {
            url: getPreviewUrl("home"),
            width: 1200,
            height: 630,
            alt: siteTitle,
          },
        ],
      },
    };
  }

  const title = `${
    thesis.titleTurkish || thesis.titleForeign || `Tez ${thesis.id}`
  } | ${siteTitle}`;
  const description = truncateDescription(
    thesis.abstractTurkish ||
      thesis.abstractForeign ||
      "Bu tezin özeti bulunamadı."
  );

  return {
    title,
    description,
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [
        {
          url: getPreviewUrl("home"),
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
  };
}

function Divider() {
  return <div className="w-full my-2 h-px rounded-full bg-border" />;
}

const maxDescriptionLength = 160;

function truncateDescription(description: string) {
  return description.length > maxDescriptionLength
    ? description.slice(0, maxDescriptionLength) + "..."
    : description;
}
