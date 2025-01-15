import { SearchThesesSchema } from "@/components/search/types";
import { getThesis, searchTheses } from "@/server/db/repo/theses";
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
});
