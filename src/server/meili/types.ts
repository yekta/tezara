import { z } from "zod";

export const ThesisSchema = z.object({
  id: z.number(),
  detail_id_1: z.string().nullable(),
  detail_id_2: z.string().nullable(),
  author: z.string().nullable(),
  year: z.number().nullable(),
  title_original: z.string().nullable(),
  title_translated: z.string().nullable(),
  university: z.string().nullable(),
  language: z.string().nullable(),
  thesis_type: z.string().nullable(),
  subjects_turkish: z.array(z.string()).nullable(),
  subjects_english: z.array(z.string()).nullable(),
});

export const ThesisExtentionSchema = z.object({
  pdf_url: z.string().nullable(),
  advisors: z.array(z.string()).nullable(),
  pages: z.number().nullable(),
  abstract_original: z.string().nullable(),
  abstract_translated: z.string().nullable(),
  keywords_turkish: z.array(z.string()).nullable(),
  keywords_english: z.array(z.string()).nullable(),
  status: z.string().nullable(),
  institute: z.string().nullable(),
  department: z.string().nullable(),
  branch: z.string().nullable(),
});

export const ThesisExtendedSchema = ThesisSchema.merge(ThesisExtentionSchema);

export type TThesis = z.infer<typeof ThesisSchema>;
export type TExtention = z.infer<typeof ThesisExtentionSchema>;
export type TThesisExtended = TThesis & TExtention;
export const allThesisAttributes = ThesisExtendedSchema.keyof().options;
export type TThesisAttribute = (typeof allThesisAttributes)[number];

export type TThesisType = {
  id: string;
  name: string;
};

export type TUniversity = {
  id: string;
  name: string;
};

export type TAdvisor = {
  id: string;
  name: string;
};

export type TAuthor = {
  id: string;
  name: string;
};

export type TLanguage = {
  id: string;
  name: string;
};
