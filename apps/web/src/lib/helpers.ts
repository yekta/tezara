import { getPreviewUrl } from "@/lib/constants";
import type { Metadata } from "next";

export function getTwitterMeta({
  title,
  description,
  slug = "home",
  addImages,
}: {
  title: string;
  description: string;
  slug?: string;
  addImages?: boolean;
}): Metadata["twitter"] {
  return {
    title,
    description,
    card: "summary_large_image",
    images: addImages
      ? [
          {
            url: getPreviewUrl(slug),
            width: 1200,
            height: 630,
            alt: title,
          },
        ]
      : undefined,
  };
}

export const truncateString = (str: string, length: number): string => {
  return str.length > length ? str.slice(0, length) + "..." : str;
};
