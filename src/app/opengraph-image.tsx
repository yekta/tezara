import DefaultOpenGraphImage, {
  getOpengraphFonts,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import { ImageResponse } from "next/og";

export const alt = "Tezara";
export const size = opengraphSize;
export const contentType = opengraphContentType;

export default async function Image() {
  return new ImageResponse(<DefaultOpenGraphImage />, {
    ...size,
    // @ts-expect-error - This is fine, they don't export the type so I can't set it
    fonts: await getOpengraphFonts(),
  });
}
