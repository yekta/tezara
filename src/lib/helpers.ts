import { getPreviewUrl } from "@/lib/constants";
import type { Metadata } from "next";

export function getTwitterMeta({
  title,
  description,
  slug = "home",
  noImages,
}: {
  title: string;
  description: string;
  slug?: string;
  noImages?: boolean;
}): Metadata["twitter"] {
  return {
    title,
    description,
    card: "summary_large_image",
    images: noImages
      ? undefined
      : [
          {
            url: getPreviewUrl(slug),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
  };
}

export const truncateString = (str: string, length: number): string => {
  return str.length > length ? str.slice(0, length) + "..." : str;
};
