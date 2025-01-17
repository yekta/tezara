import { AppRouterOutputs } from "@/server/trpc/api/root";

const emptyFieldText = "[[Yok]]";

export function formatForDownload(
  data: AppRouterOutputs["main"]["searchTheses"]
) {
  const formattedData: Record<string, string | number>[] = [];
  for (let i = 0; i < data.length; i++) {
    const result = data[i];
    formattedData.push({
      "Tez No": result.id,
      "Başlık (Orijinal)": result.titleOriginal || emptyFieldText,
      "Başlık (Çeviri)": result.titleTranslated || emptyFieldText,
      "Özet (Orijinal)": result.abstractOriginal || emptyFieldText,
      "Özet (Çeviri)": result.abstractTranslated || emptyFieldText,
      Yazar: result.authorName || emptyFieldText,
      Üniversite: result.universityName || emptyFieldText,
      Enstitü: result.instituteName || emptyFieldText,
      "Ana Bilim Dalı": result.departmentName || emptyFieldText,
      "Bilim Dalı": result.branchName || emptyFieldText,
      "Tez Türü": result.thesisTypeName || emptyFieldText,
      Danışmanlar:
        result.advisors.length > 0
          ? result.advisors.map((advisor) => advisor.name).join(", ")
          : emptyFieldText,
      Yıl: result.year || emptyFieldText,
      "Safya Sayısı": result.pageCount || emptyFieldText,
      Dil: result.languageName || emptyFieldText,
      "PDF Linki": result.pdfUrl || emptyFieldText,
    });
  }
  return formattedData;
}
