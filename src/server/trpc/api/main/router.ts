import { getUniversities } from "@/server/clickhouse/repo/universities";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/setup/trpc";
import { z } from "zod";

export const mainRouter = createTRPCRouter({
  getUniversities: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
      })
    )
    .query(async function ({ input: { page } }) {
      const result = await getUniversities({ page, perPage: 30 });

      return result;
    }),
});
