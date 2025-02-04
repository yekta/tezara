import { prefetchAdvisors } from "@/lib/queries/prefetch-advisors";
import { prefetchAuthors } from "@/lib/queries/prefetch-authors";
import { prefetchDepartments } from "@/lib/queries/prefetch-departments";
import { QueryClient } from "@tanstack/react-query";

export async function prefetchSearchLikePage({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  await Promise.all([
    prefetchAdvisors({ queryClient }),
    prefetchAuthors({ queryClient }),
    prefetchDepartments({ queryClient }),
  ]);
}
