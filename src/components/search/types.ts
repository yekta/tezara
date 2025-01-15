import { z } from "zod";

const QueryOnEnum = z.enum([
  "title",
  "abstract",
  "author",
  "advisor",
  "university",
  "department",
  "branch",
  "language",
]);

export type TQueryOn = z.infer<typeof QueryOnEnum>;

export const queryOnValues: TQueryOn[] = QueryOnEnum.options;

export const SearchThesesSchema = z.object({
  query: z.string(),
  queryOn: z.array(QueryOnEnum).optional(),
  yearLte: z.number().optional(),
  yearGte: z.number().optional(),
  languages: z.array(z.string()).optional(),
  thesisTypes: z.array(z.string()).optional(),
  universities: z.array(z.string()).optional(),
  institutes: z.array(z.string()).optional(),
  departments: z.array(z.string()).optional(),
  branches: z.array(z.string()).optional(),
  advisors: z.array(z.string()).optional(),
  authors: z.array(z.string()).optional(),
});

export type TSearchThesesSchema = z.infer<typeof SearchThesesSchema>;
