import { SearchThesesSchema } from "@/components/search/types";
import { getLanguages } from "@/server/db/repo/language";
import { getThesis, searchTheses } from "@/server/db/repo/thesis";
import { getThesisTypes } from "@/server/db/repo/thesis-type";
import { getUniversities } from "@/server/db/repo/university";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/setup/trpc";
import { z } from "zod";

export const mainRouter = createTRPCRouter({
  getThesis: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async function ({ input: { id } }) {
      const result = await getThesis({ id });
      return result;
    }),
  searchTheses: publicProcedure
    .input(SearchThesesSchema)
    .query(async function ({ input }) {
      const result = await searchTheses(input);
      return result;
    }),
  getLanguages: publicProcedure.input(z.object({})).query(async function () {
    const result = await getLanguages();
    return result;
  }),
  getUniversities: publicProcedure.input(z.object({})).query(async function () {
    const result = await getUniversities();
    return result;
  }),
  getThesisTypes: publicProcedure.input(z.object({})).query(async function () {
    const result = await getThesisTypes();
    return result;
  }),
});
