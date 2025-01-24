import { z } from "zod";

const LanguageEnum = z.enum(["Turkish", "English"]);

const SubjectSchema = z.object({
  name: z.string().nonempty(),
  language: LanguageEnum,
});

const KeywordSchema = z.object({
  name: z.string().nonempty(),
  language: LanguageEnum,
});

export const ThesisSchema = z.object({
  // Has to be there
  id: z.number(),
  title_original: z.string().nonempty(),
  author: z.string().nonempty(),
  advisors: z.array(z.string().nonempty()),
  university: z.string().nonempty(),
  institute: z.string().nonempty(),
  detail_id_1: z.string().nonempty(),
  detail_id_2: z.string().nonempty(),
  year: z.number().min(1),
  thesis_type: z.string().nonempty(),
  language: z.string().nonempty(),
  keywords: z.array(KeywordSchema),
  subjects: z.array(SubjectSchema),

  // Can be null
  title_translated: z.string().nonempty().nullable(),
  abstract_original: z.string().nonempty().nullable(),
  abstract_translated: z.string().nonempty().nullable(),
  page_count: z.number().min(1).nullable(),
  pdf_url: z.string().nonempty().nullable(),
  department: z.string().nonempty().nullable(),
  branch: z.string().nonempty().nullable(),
});

export type TThesis = z.infer<typeof ThesisSchema>;

export const allThesisAttributes = ThesisSchema.keyof().options;
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
