"use client";

import { SearchIcon } from "@/components/icons/search-icon";
import { TSearchLikePageParamParsers } from "@/components/search/constants";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { useUmami } from "@/lib/hooks/use-umami";
import { usePostHog } from "posthog-js/react";

type Props<T extends keyof TSearchLikePageParamParsers> = {
  href: string;
  variant: T;
  filters?: Partial<Record<T, TSearchLikePageParamParsers[T]>>;
  className?: string;
};

export default function SearchAllLinkButton<
  T extends keyof TSearchLikePageParamParsers
>({ href, variant, filters, className }: Props<T>) {
  const umami = useUmami();
  const posthog = usePostHog();

  const onClick = () => {
    umami.capture("Searched", {
      Query: "",
      Variant: variant,
      Filters: filters,
    });
    posthog.capture("Searched", {
      Query: "",
      Variant: variant,
      Filters: filters,
    });
  };

  return (
    <LinkButton
      href={href}
      onClick={onClick}
      className={cn("py-2.25 px-4.5 gap-2", className)}
    >
      <SearchIcon className="size-5 -ml-1.75" />
      <span className="flex shrink min-w-0">Tümünü Ara</span>
    </LinkButton>
  );
}
