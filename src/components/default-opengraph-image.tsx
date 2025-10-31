import PenToolIcon from "@/components/icons/pen-tool";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import Logo from "@/components/logo/logo";
import ImageResponse from "@takumi-rs/image-response";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CSSProperties } from "react";

type Props = {
  logoSize?: number;
};

export const logoAspectRatio = 100 / 24;
export const background = "hsl(0 0% 100%)";
export const foreground = "hsl(250 25% 4%)";
export const foregroundMuted = "hsl(250 6% 35%)";

export const opengraphSize = {
  width: 1200,
  height: 630,
};
export const opengraphContentType = "image/png";
export const defaultParagraphClassName: CSSProperties = {
  wordBreak: "break-all",
  textWrap: "balance",
};

export default function DefaultOpenGraphImage({ logoSize = 500 }: Props) {
  return (
    <div
      style={{
        backgroundColor: background,
        color: foreground,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ScrollTextIcon
        style={{
          color: foreground,
          opacity: 0.15,
          width: 330,
          height: 330,
          position: "absolute",
          left: -48,
          top: -72,
        }}
        strokeWidth={1.5}
      />
      <PenToolIcon
        style={{
          color: foreground,
          opacity: 0.15,
          width: 320,
          height: 320,
          position: "absolute",
          right: -40,
          bottom: -56,
          transform: "rotate(-5deg)",
        }}
        strokeWidth={1.5}
      />

      <Logo
        variant="full"
        style={{
          width: logoSize,
          height: logoSize / logoAspectRatio,
          marginTop: -34,
          marginLeft: -44,
        }}
      />
    </div>
  );
}

type TFont = {
  name: string;
  weight: number;
  style: "normal" | "italic";
  data: Buffer<ArrayBufferLike>;
};

let fonts: TFont[] | undefined = undefined;

export async function getOpengraphFonts() {
  if (fonts) {
    console.log("𝑓 Returning cached fonts");
    return fonts;
  }

  const getFontFile = async (path: string) => {
    const data = await readFile(
      join(process.cwd(), `public/static/fonts/${path}`)
    );
    return data;
  };

  const fontBold = getFontFile(`DMSansBold.ttf`);
  const fontSemiBold = getFontFile(`DMSansSemiBold.ttf`);
  const fontMedium = getFontFile(`DMSansMedium.ttf`);

  const [fontBoldData, fontSemiBoldData, fontMediumData] = await Promise.all([
    fontBold,
    fontSemiBold,
    fontMedium,
  ]);

  fonts = [
    {
      name: "dm",
      weight: 700,
      style: "normal",
      data: fontBoldData,
    },
    {
      name: "dm",
      weight: 600,
      style: "normal",
      data: fontSemiBoldData,
    },
    {
      name: "dm",
      weight: 500,
      style: "normal",
      data: fontMediumData,
    },
  ];

  return fonts;
}

export async function DefaultOpenGraphResponse() {
  return new ImageResponse(<DefaultOpenGraphImage />, {
    ...opengraphSize,
    fonts: await getOpengraphFonts(),
  });
}
