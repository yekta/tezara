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

function mb(n: number) {
  return Math.round(n / 1024 / 1024);
}

export function logMemory(tag: string) {
  const m = process.memoryUsage();
  console.log(
    `[${tag}] heap=${mb(m.heapUsed)}MB rss=${mb(m.rss)}MB ext=${mb(
      m.external
    )}MB`
  );
}
