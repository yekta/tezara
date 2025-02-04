import { prefetchAdvisors } from "@/lib/queries/prefetch-advisors";
import { prefetchAuthors } from "@/lib/queries/prefetch-authors";
import { prefetchDepartments } from "@/lib/queries/prefetch-departments";
import { QueryClient } from "@tanstack/react-query";

export function getSearchLikePagePrefetchPromises({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  return [
    prefetchAdvisors({ queryClient }),
    prefetchAuthors({ queryClient }),
    prefetchDepartments({ queryClient }),
  ];
}
