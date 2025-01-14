import { getThesis } from "@/server/db/repo/thesis";
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
});
