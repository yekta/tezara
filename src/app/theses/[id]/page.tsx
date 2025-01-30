import NavigationSection from "@/app/theses/[id]/_components/NavigationSection";
import GoBackBar from "@/app/theses/[id]/go-back-bar";
import { thesesRoute } from "@/app/theses/_components/constants";
import FileExtensionIcon from "@/components/icons/sets/file-extension";
import ThesisRowList from "@/components/search/results/thesis-row-list";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getThesis, searchTheses } from "@/server/meili/repo/thesis";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 3600;

export default async function Page({ params }: Props) {
  const { id } = await params;
  const idNumber = parseInt(Number(id).toString());
  const isIdValid = !isNaN(idNumber) && idNumber >= 0;

  if (!isIdValid) {
    return notFound();
  }

  let thesis: Awaited<ReturnType<typeof getThesis>> | null = null;
  let similarTheses: Awaited<ReturnType<typeof searchTheses>> | null = null;

  try {
    const start = performance.now();
    thesis = await getThesis({ id: idNumber, client: meiliAdmin });
    const end = performance.now();
    console.log(
      `${thesesRoute}/[id]:getThesis(${idNumber}) | ${Math.round(
        end - start
      )}ms`
    );
  } catch (error) {
    console.error(`Failed to fetch thesis ID: ${idNumber}`, error);
    return notFound();
  }
  if (!thesis) return notFound();

  const start = performance.now();
  try {
    similarTheses = await searchTheses({
      q: thesis.title_original || thesis.title_translated || "",
      hits_per_page: 6,
      page: 1,
      languages: [],
      thesis_types: [],
      universities: [],
      departments: [],
      authors: [],
      advisors: [],
      subjects: [],
      sort: undefined,
      year_gte: null,
      year_lte: null,
      search_on: [],
      attributes_to_retrieve: undefined,
      attributes_to_not_retrieve: undefined,
      client: meiliAdmin,
    });
    similarTheses.hits = similarTheses.hits.filter(
      (hit) => hit.id !== idNumber
    );
  } catch (error) {
    console.log("Failed to fetch similar theses.", error);
  }
  const end = performance.now();
  console.log(
    `${thesesRoute}/[id]:getSimilarTheses(${idNumber}) | ${Math.round(
      end - start
    )}ms`
  );

  const noAbstractText = "Özet yok.";
  const noTranslatedAbstractText = "Özet çevirisi mevcut değil.";
  const noTitle = "Başlık mevcut değil.";
  const noTranslatedTitle = "Başlık çevirisi mevcut değil.";
  const notAvailable = "Belirtilmemiş.";
  return (
    <div className="w-full shrink min-w-0 max-w-2xl flex flex-col flex-1 md:pt-2 pb-20 md:pb-32">
      <NavigationSection id={thesis.id} className="md:hidden pb-4" />
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
      <div className="pt-4.5 flex flex-wrap items-start justify-start gap-1.5">
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
            <FileExtensionIcon className="size-5 -ml-1.5" variant="pdf-x" />
            <p className="shrink min-w-0">PDF Yok</p>
          </Button>
        )}
        {/* <Button size="sm" variant="success" disabled>
          <FileExtensionIcon className="size-5 -ml-1.5" variant="csv" />
          <p className="shrink min-w-0">Tablo İndir</p>
        </Button>
        <Button size="sm" disabled>
          <FileExtensionIcon className="size-5 -ml-1.5" variant="json" />
          <p className="shrink min-w-0">JSON İndir</p>
        </Button> */}
      </div>
      {/* Details */}
      <ol id="details" className="w-full flex flex-col text-sm pt-6">
        <DetailsListItem id="thesis_id_section" title="Tez No">
          {thesis.id}
        </DetailsListItem>
        <DetailsListItem id="author_section" title="Yazar">
          {thesis.author}
        </DetailsListItem>
        <DetailsListItem id="advisor_names_section" title="Danışmanlar">
          {!thesis.advisors || thesis.advisors.length < 1
            ? notAvailable
            : thesis.advisors.map((advisor) => advisor).join(", ")}
        </DetailsListItem>
        <DetailsListItem id="thesis_type_section" title="Tez Türü">
          {thesis.thesis_type || notAvailable}
        </DetailsListItem>
        <DetailsListItem title="Konular" id="subjects_section">
          {thesis.subjects && thesis.subjects.length > 1
            ? thesis.subjects
                .sort((a, b) => {
                  if (a.language === "Turkish" && b.language === "English")
                    return -1;
                  if (a.language === "English" && b.language === "Turkish")
                    return 1;
                  return 0;
                })
                .map((i, index) =>
                  i.language === "Turkish" ? (
                    <span key={i.name}>
                      {index === 0 ? "" : ", "}
                      <LinkButton
                        className="py-0.25 rounded text-link-chip bg-link-chip/12 px-1.25"
                        variant="ghost"
                        target="_blank"
                        href={`/subjects/${encodeURIComponent(i.name)}`}
                      >
                        {i.name}
                      </LinkButton>
                    </span>
                  ) : (
                    <span key={i.name}>
                      {index === 0 ? "" : ", "}
                      {i.name}
                    </span>
                  )
                )
            : notAvailable}
        </DetailsListItem>
        <DetailsListItem id="keywords_section" title="Anahtar Kelimeler">
          {thesis.keywords && thesis.keywords.length > 1
            ? thesis.keywords
                .sort((a, b) => {
                  if (a.language === "Turkish" && b.language === "English")
                    return -1;
                  if (a.language === "English" && b.language === "Turkish")
                    return 1;
                  return 0;
                })
                .map((i) => i.name)
                .join(", ")
            : notAvailable}
        </DetailsListItem>
        <DetailsListItem id="year_section" title="Yıl">
          {thesis.year}
        </DetailsListItem>
        <DetailsListItem id="language_section" title="Dil">
          {thesis.language}
        </DetailsListItem>
        <DetailsListItem id="university_section" title="Üniversite">
          <LinkButton
            className="py-0.25 rounded text-link-chip bg-link-chip/12 px-1.25"
            variant="ghost"
            target="_blank"
            href={`/university/${encodeURIComponent(thesis.university)}`}
          >
            {thesis.university}
          </LinkButton>
        </DetailsListItem>
        <DetailsListItem id="institute_section" title="Enstitü">
          {thesis.institute || notAvailable}
        </DetailsListItem>
        <DetailsListItem id="department_section" title="Ana Bilim Dalı">
          {thesis.department || notAvailable}
        </DetailsListItem>
        <DetailsListItem id="branch_section" title="Bilim Dalı">
          {thesis.branch || notAvailable}
        </DetailsListItem>
        <DetailsListItem
          id="page_count_section"
          title="Sayfa Sayısı"
          className="border-b"
        >
          {thesis.page_count || notAvailable}
        </DetailsListItem>
      </ol>
      {/* Abstract */}
      <div id="abstract_section" className="pt-8">
        <h3 className="font-bold text-xl">Özet</h3>
        <p id="abstract" className="pt-3 text-lg">
          {thesis.abstract_original || noAbstractText}
        </p>
      </div>
      {/* Translated abstract */}
      <div id="abstract_translated_section" className="pt-6">
        <h3 className="font-bold text-xl">Özet (Çeviri)</h3>
        <p id="abstract_translated" className="pt-3 text-lg">
          {thesis.abstract_translated || noTranslatedAbstractText}
        </p>
      </div>
      <Divider className="my-10" />
      {similarTheses && (
        <div id="similar_theses_section" className="w-full flex flex-col">
          <h3 className="font-bold text-xl">Benzer Tezler</h3>
          <ThesisRowList
            data={similarTheses}
            className="w-full flex flex-col pt-4"
            classNameRow="first-of-type:border-t last-of-type:border-b"
          />
        </div>
      )}
      <NavigationSection id={thesis.id} className="md:hidden py-4" />
      <GoBackBar
        defaultPath="/search"
        buttonText="Geri Dön"
        className="pb-4 -mt-2 md:mt-6"
      />
    </div>
  );
}

function DetailsListItem({
  title,
  id,
  className,
  children,
}: {
  title: string;
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li
      id={id}
      className={cn(
        "leading-normal py-2 border-t border-foreground/10",
        className
      )}
    >
      <span className="font-medium text-muted-foreground">{title}: </span>
      <span className="font-bold">{children}</span>
    </li>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const titleSuffix = `Tezler | ${siteTitle}`;
  const notFoundTitle = `Tez Bulunamadı | ${titleSuffix}`;
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
  } | ${titleSuffix}`;
  const description = truncateDescription(
    thesis.abstract_original ||
      thesis.abstract_translated ||
      `Tez detaylarını ${siteTitle} üzerinde incele.`
  );

  return {
    title,
    description,
    publisher: thesis.university,
    keywords:
      thesis.keywords.length > 0
        ? thesis.keywords.map((i) => i.name)
        : thesis.subjects.length > 0
        ? thesis.subjects.map((subject) => subject.name)
        : undefined,
    authors: {
      name: thesis.author,
    },
    openGraph: {
      publishedTime: new Date(thesis.year, 5, 15, 14, 0).toISOString(),
      type: "article",
      tags:
        thesis.subjects.length > 0
          ? thesis.subjects.map((subject) => subject.name)
          : undefined,
    },
    twitter: getTwitterMeta({
      title,
      description,
    }),
  };
}

function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full my-2 h-px rounded-full bg-foreground/10",
        className
      )}
    />
  );
}

const maxDescriptionLength = 160;

function truncateDescription(description: string) {
  return description.length > maxDescriptionLength
    ? description.slice(0, maxDescriptionLength) + "..."
    : description;
}
