import NavigationSection from "@/app/thesis/[id]/_components/NavigationSection";
import FileExtensionIcon from "@/components/icons/file-extension";
import { Button, LinkButton } from "@/components/ui/button";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getThesis } from "@/server/meili/repo/thesis";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const idNumber = parseInt(Number(id).toString());
  const isIdValid = !isNaN(idNumber) && idNumber >= 0;

  if (!isIdValid) {
    return notFound();
  }

  const thesis = await getThesis({ id: idNumber, client: meiliAdmin });
  if (!thesis) {
    return notFound();
  }

  const noAbstractText = "Özet yok.";
  const noTranslatedAbstractText = "Özet çevirisi mevcut değil.";
  const noAdvisorText = "Danışman mevcut değil.";
  const noDepartment = "Ana bilim dalı belirtilmemiş.";
  const noInstitute = "Enstitü belirtilmemiş.";
  const noBranch = "Bilim dalı belirtilmemiş.";
  const noTitle = "Başlık mevcut değil.";
  const noTranslatedTitle = "Başlık çevirisi mevcut değil.";
  const noThesisType = "Tez türü belirtilmemiş.";

  return (
    <div className="w-full shrink min-w-0 max-w-2xl flex flex-col flex-1 md:pt-2 pb-20 md:pb-32">
      {/* Title */}
      <h1 id="title" className="font-bold text-2xl text-balance leading-tight">
        {thesis?.title_original || noTitle}
      </h1>
      {/* Translated title */}
      <h2
        id="title_translated"
        className="font-semibold text-lg text-balance text-muted-foreground leading-snug mt-3"
      >
        {thesis?.title_translated || noTranslatedTitle}
      </h2>
      <div className="mt-6 flex flex-wrap items-start justify-start gap-1.5">
        {thesis.pdf_url ? (
          <LinkButton
            href={thesis.pdf_url}
            target="_blank"
            size="sm"
            variant="destructive"
          >
            <FileExtensionIcon className="size-5 -ml-1.5" variant="pdf" />
            <p className="shrink min-w-0">PDF İndir</p>
          </LinkButton>
        ) : (
          <Button size="sm" variant="destructive" disabled>
            <FileExtensionIcon className="size-5 -ml-1.5" variant="no-pdf" />
            <p className="shrink min-w-0">PDF Yok</p>
          </Button>
        )}
        <Button size="sm" variant="success" disabled>
          <FileExtensionIcon className="size-5 -ml-1.5" variant="csv" />
          <p className="shrink min-w-0">Tablo İndir</p>
        </Button>
        <Button size="sm" disabled>
          <FileExtensionIcon className="size-5 -ml-1.5" variant="json" />
          <p className="shrink min-w-0">JSON İndir</p>
        </Button>
      </div>
      {/* Details */}
      <div id="details" className="w-full flex flex-col text-sm mt-6">
        <Divider />
        <p id="thesis_id_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">Tez No: </span>
          <span className="font-bold" id="thesis_id">
            {thesis.id}
          </span>
        </p>
        <Divider />
        <p id="author_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">Yazar: </span>
          <span className="font-bold" id="author_name">
            {thesis.author}
          </span>
        </p>
        <Divider />
        <p id="advisor_names_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">
            Danışmanlar:{" "}
          </span>
          <span className="font-bold" id="advisor_names">
            {!thesis.advisors || thesis.advisors.length < 1
              ? noAdvisorText
              : thesis.advisors.map((advisor) => advisor).join(", ")}
          </span>
        </p>
        <Divider />
        <p id="thesis_type_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">Tez Türü: </span>
          <span className="font-bold" id="thesis_type">
            {thesis.thesis_type || noThesisType}
          </span>
        </p>
        <Divider />
        <p id="year_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">Yıl: </span>
          <span className="font-bold" id="year">
            {thesis.year}
          </span>
        </p>
        <Divider />
        <p id="language_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">Dil: </span>
          <span className="font-bold" id="language_name">
            {thesis.language}
          </span>
        </p>
        <Divider />
        <p id="university_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">
            Üniversite:{" "}
          </span>
          <span className="font-bold" id="university_name">
            {thesis.university}
          </span>
        </p>
        <Divider />
        <p id="institute_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">Enstitü: </span>
          <span className="font-bold" id="institute_name">
            {thesis.institute || noInstitute}
          </span>
        </p>
        <Divider />
        <p id="department_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">
            Ana Bilim Dalı:{" "}
          </span>
          <span className="font-bold" id="department_name">
            {thesis.department || noDepartment}
          </span>
        </p>
        <Divider />
        <p id="branch_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">
            Bilim Dalı:{" "}
          </span>
          <span className="font-bold" id="branch_name">
            {thesis.branch || noBranch}
          </span>
        </p>
        <Divider />
        <p id="page_count_section" className="leading-snug">
          <span className="font-medium text-muted-foreground">
            Sayfa Sayısı:{" "}
          </span>
          <span className="font-bold" id="page_count">
            {thesis.pages}
          </span>
        </p>
        <Divider />
      </div>
      {/* Abstract */}
      <div id="abstract_section" className="mt-6">
        <p className="font-bold">Özet</p>
        <p id="abstract" className="mt-1">
          {thesis.abstract_original || noAbstractText}
        </p>
      </div>
      {/* Translated abstract */}
      <div id="abstract_translated_section" className="mt-6">
        <p className="font-bold">Özet (Çeviri)</p>
        <p id="abstract_translated" className="mt-1">
          {thesis.abstract_translated || noTranslatedAbstractText}
        </p>
      </div>
      <NavigationSection id={thesis.id} className="md:hidden pb-4 mt-8" />
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const notFoundTitle = `Tez Bulunamadı | ${siteTitle}`;
  const notFoundDescription = `${id} numaralı tezi ${siteTitle} platformunda mevcut değil.`;
  const notFoundMeta: Metadata = {
    title: notFoundTitle,
    description: notFoundDescription,
    twitter: getTwitterMeta({
      title: notFoundTitle,
      description: notFoundDescription,
    }),
  };

  const idNumber = parseInt(Number(id).toString());
  const isIdValid = !isNaN(idNumber) && idNumber >= 0;
  if (!isIdValid) {
    return notFoundMeta;
  }

  const thesis = await getThesis({ id: idNumber, client: meiliAdmin });

  if (!thesis) {
    return notFoundMeta;
  }

  const title = `${
    thesis.title_original || thesis.title_translated || `Tez ${thesis.id}`
  } | ${siteTitle}`;
  const description = truncateDescription(
    thesis.abstract_original ||
      thesis.abstract_translated ||
      "Bu tezin özeti bulunamadı."
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

function Divider() {
  return <div className="w-full my-2 h-px rounded-full bg-border" />;
}

const maxDescriptionLength = 160;

function truncateDescription(description: string) {
  return description.length > maxDescriptionLength
    ? description.slice(0, maxDescriptionLength) + "..."
    : description;
}
