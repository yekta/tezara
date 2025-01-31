"use client";

import { useIsTouchscreen } from "@/components/providers/is-touchscreen-provider";
import { SearchLikePageQueryParamProvider } from "@/components/search/query-param-provider";
import AdvancedFiltersSection from "@/components/search/search-box/advanced-filters-section";
import ButtonsSection from "@/components/search/search-box/buttons-section";
import FilterChips from "@/components/search/search-box/filter-chips";
import {
  focusToMainInput,
  mainSearchInputId,
} from "@/components/search/search-box/helpers";
import SearchInput from "@/components/search/search-box/search-input";
import { cn } from "@/components/ui/utils";
import { useAsyncRouterPush } from "@/lib/hooks/use-async-router-push";
import { useUmami } from "@/lib/hooks/use-umami";
import { TGetLanguagesResult } from "@/server/meili/repo/language";
import { TGetSubjectsResult } from "@/server/meili/repo/subject";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { TGetUniversitiesResult } from "@/server/meili/repo/university";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  className?: string;
  variant: "home" | "search";
  universitiesData: TGetUniversitiesResult["hits"];
  languagesData: TGetLanguagesResult["hits"];
  thesisTypesData: TGetThesisTypesResult["hits"];
  subjectsData: TGetSubjectsResult["hits"];
};

const searchRoute = "/search";

export default function SearchBox({
  languagesData,
  universitiesData,
  thesisTypesData,
  subjectsData,
  className,
  variant,
}: Props) {
  const umami = useUmami();
  const posthog = usePostHog();

  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();
  const [isPendingHackyPush, setIsPendingHackyPush] = useState(false);
  const isPendingPush = isPendingAsyncPush || isPendingHackyPush;

  useHotkeys("mod+k", () => {
    focusToMainInput();
  });

  const pushToSearch = async (q: string) => {
    const params = new URLSearchParams(window.location.search);
    if (q) params.set("q", q);
    const paramStr = params.toString();
    await asyncPush(`${searchRoute}${paramStr ? `?${paramStr}` : ""}`);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (variant === "home") {
      const formData = new FormData(e.currentTarget);
      const query = formData.get(mainSearchInputId)?.toString() || "";
      setIsPendingHackyPush(true);
      try {
        umami.capture("Searched", {
          Query: query,
          Variant: variant,
        });
        posthog.capture("Searched", {
          Query: query,
          Variant: variant,
        });
        await pushToSearch(query);

        let counter = 20;
        let pathname = window.location.pathname;

        // TO-DO: Fix this, it is a horrible hack for Safari caused by search params not updating
        while (
          counter > 0 &&
          (pathname !== searchRoute || !pathname.startsWith(searchRoute)) &&
          !isPendingAsyncPush
        ) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          pathname = window.location.pathname;
          if (pathname === searchRoute) return;
          await pushToSearch(query);
          counter--;
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsPendingHackyPush(false);
      }
    }
  }

  const isTouchScreen = useIsTouchscreen();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isTouchScreen) return;
      if (window.location.hash) {
        const id = window.location.hash.slice(1);
        const el = document.getElementById(id);
        if (el) return;
      }
      focusToMainInput();
    });
    return () => clearTimeout(timeoutId);
  }, [isTouchScreen]);

  return (
    <SearchLikePageQueryParamProvider>
      <form
        onSubmit={onSubmit}
        className={cn(
          "w-full group/form flex flex-col items-center",
          className
        )}
      >
        <SearchInput variant={variant} isPendingPush={isPendingPush} />
        <div className="w-full flex flex-col items-center group pt-3">
          <ButtonsSection isPendingPush={isPendingPush} />
          <FilterChips className="pt-2.5" />
          <AdvancedFiltersSection
            className="pt-2"
            universitiesData={universitiesData}
            languagesData={languagesData}
            thesisTypesData={thesisTypesData}
            subjectsData={subjectsData}
          />
        </div>
      </form>
    </SearchLikePageQueryParamProvider>
  );
}
