import {
  getSubjectStats,
  getTotalSubjectStatsCount,
} from "@/server/clickhouse/repo/subject";
import {
  getTotalUniversityCount,
  getUniversities,
} from "@/server/clickhouse/repo/university";
import { TSubjectOrKeywordLanguage } from "@/server/meili/types";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/setup/trpc";
import { z } from "zod";

export const mainRouter = createTRPCRouter({
  getUniversities: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
        q: z.string().optional(),
      })
    )
    .query(async function ({ input: { page, q } }) {
      const perPage = 30;
      const [result, total] = await Promise.all([
        getUniversities({ page, perPage, q }),
        getTotalUniversityCount({ q }),
      ]);
      const maxPage = Math.ceil(total / perPage);

      return {
        result,
        maxPage,
        totalCount: total,
      };
    }),
  getSubjects: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
        q: z.string().optional(),
      })
    )
    .query(async function ({ input: { page, q } }) {
      const perPage = 30;
      const languages: TSubjectOrKeywordLanguage[] = ["Turkish"];
      const [result, total] = await Promise.all([
        getSubjectStats({ page, perPage, q, languages }),
        getTotalSubjectStatsCount({ q, languages }),
      ]);
      const maxPage = Math.ceil(total / perPage);

      return {
        result,
        maxPage,
        totalCount: total,
      };
    }),
});
