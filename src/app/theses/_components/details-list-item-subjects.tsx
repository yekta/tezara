"use client";

import { subjectsRoute } from "@/app/subjects/_components/constants";
import DetailsListItem from "@/app/theses/_components/details-list-item";
import { LinkButton } from "@/components/ui/button";
import { previousPathAtom } from "@/lib/store/main";
import { TThesis } from "@/server/meili/types";
import { useSetAtom } from "jotai";
import { useCallback } from "react";

type Props = {
  thesis: TThesis;
};

const notAvailable = "Belirtilmemiş.";
const id = "subjects_section";

export default function DetailsListItemSubjects({ thesis }: Props) {
  const setPreviousPath = useSetAtom(previousPathAtom);

  const onClick = useCallback(() => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    setPreviousPath(`${pathname}${search}`);
  }, [setPreviousPath]);

  return (
    <DetailsListItem title="Konular" id={id}>
      {thesis.subjects && thesis.subjects.length > 1
        ? thesis.subjects
            .sort((a, b) => {
              if (a.language === "Turkish" && b.language === "English")
                return -1;
              if (a.language === "English" && b.language === "Turkish")
                return 1;
              return 0;
            })
            .map((i, index) =>
              i.language === "Turkish" ? (
                <span key={i.name}>
                  {index === 0 ? "" : ", "}
                  <LinkButton
                    onClick={onClick}
                    className="py-0.25 rounded text-link-chip bg-link-chip/12 px-1.25"
                    variant="ghost"
                    href={`${subjectsRoute}/${encodeURIComponent(i.name)}`}
                  >
                    {i.name}
                  </LinkButton>
                </span>
              ) : (
                <span key={i.name}>
                  {index === 0 ? "" : ", "}
                  {i.name}
                </span>
              )
            )
        : notAvailable}
    </DetailsListItem>
  );
}
