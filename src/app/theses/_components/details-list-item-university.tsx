"use client";

import DetailsListItem from "@/app/theses/_components/details-list-item";
import { universitiesRoute } from "@/app/universities/_components/constants";
import { LinkButton } from "@/components/ui/button";
import { previousPathAtom } from "@/lib/store/main";
import { TThesis } from "@/server/meili/types";
import { useSetAtom } from "jotai";
import { useCallback } from "react";

type Props = {
  thesis: TThesis;
};

const id = "university_section";

export default function DetailsListItemUniversity({ thesis }: Props) {
  const setPreviousPath = useSetAtom(previousPathAtom);

  const onClick = useCallback(() => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    setPreviousPath(`${pathname}${search}`);
  }, [setPreviousPath]);

  return (
    <DetailsListItem id={id} title="Üniversite">
      <LinkButton
        className="py-0.25 rounded text-link-chip bg-link-chip/12 px-1.25"
        variant="ghost"
        onClick={onClick}
        href={`${universitiesRoute}/${encodeURIComponent(thesis.university)}`}
      >
        {thesis.university}
      </LinkButton>
    </DetailsListItem>
  );
}
