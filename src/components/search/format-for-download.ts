import { TSearchThesesResult } from "@/server/meili/repo/thesis";
import { UseQueryResult } from "@tanstack/react-query";

const emptyFieldText = "[[Yok]]";

export function formatForDownload(
  data: NonNullable<
    UseQueryResult<TSearchThesesResult, unknown>["data"]
  >["hits"]
) {
  const formattedData: Record<string, string | number>[] = [];
  for (let i = 0; i < data.length; i++) {
    const result = data[i];
    formattedData.push({
      "Tez No": result.id,
      "Başlık (Orijinal)": result.title_original || emptyFieldText,
      "Başlık (Çeviri)": result.title_translated || emptyFieldText,
      "Özet (Orijinal)": result.abstract_original || emptyFieldText,
      "Özet (Çeviri)": result.abstract_translated || emptyFieldText,
      Yazar: result.author || emptyFieldText,
      Üniversite: result.university || emptyFieldText,
      Enstitü: result.institute || emptyFieldText,
      "Ana Bilim Dalı": result.department || emptyFieldText,
      "Bilim Dalı": result.branch || emptyFieldText,
      "Tez Türü": result.thesis_type || emptyFieldText,
      Danışmanlar:
        result.advisors && result.advisors.length > 0
          ? result.advisors.map((advisor) => advisor).join(", ")
          : emptyFieldText,
      Yıl: result.year || emptyFieldText,
      "Safya Sayısı": result.pages || emptyFieldText,
      Dil: result.language || emptyFieldText,
      "PDF Linki": result.pdf_url || emptyFieldText,
    });
  }
  return formattedData;
}
