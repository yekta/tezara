export type TThesis = {
  id: number;
  detail_id_1: string | null;
  detail_id_2: string | null;
  author: string | null;
  year: number | null;
  title_original: string | null;
  title_translated: string | null;
  university: string | null;
  language: string | null;
  thesis_type: string | null;
  subjects_turkish: string[] | null;
  subjects_english: string[] | null;
};

export type TExtention = {
  pdf_url: string | null;
  advisors: string[] | null;
  pages: number | null;
  abstract_original: string | null;
  abstract_translated: string | null;
  keywords_turkish: string[] | null;
  keywords_english: string[] | null;
  status: string | null;
  institute: string | null;
  department: string | null;
  branch: string | null;
};

export type TThesisExtended = TThesis & TExtention;
