import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import { createCaller, type AppRouter } from "@/server/trpc/api/root";
import { createTRPCContext } from "@/server/trpc/setup/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

const createContextStatic = cache(async () => {
  const heads = new Headers();
  return createTRPCContext({
    headers: heads,
    skipAuth: true,
  });
});
const callerStatic = createCaller(createContextStatic);

export const { trpc: apiServer, HydrateClient } =
  createHydrationHelpers<AppRouter>(caller, getQueryClient);

export const { trpc: apiServerStatic, HydrateClient: HydrateClientStatic } =
  createHydrationHelpers<AppRouter>(callerStatic, getQueryClient);
