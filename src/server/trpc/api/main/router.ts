import { createTRPCRouter, publicProcedure } from "@/server/trpc/setup/trpc";

export const mainRouter = createTRPCRouter({
  getHello: publicProcedure.query(async function ({}) {
    return {
      hello: "world",
    };
  }),
});
