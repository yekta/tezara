import DefaultOpenGraphImage, {
  getOpengraphFonts,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import ImageResponse from "@takumi-rs/image-response";

export const alt = "Tezara";
export const size = opengraphSize;
export const contentType = opengraphContentType;

export default async function Image() {
  return new ImageResponse(<DefaultOpenGraphImage />, {
    ...size,
    fonts: await getOpengraphFonts(),
  });
}
