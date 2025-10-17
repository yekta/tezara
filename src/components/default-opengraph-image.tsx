import PenToolIcon from "@/components/icons/pen-tool";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import Logo from "@/components/logo/logo";
import { ImageResponse } from "next/og";
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
  wordBreak: "break-word",
  textWrap: "balance",
};

export default function DefaultOpenGraphImage({ logoSize = 500 }: Props) {
  return (
    <div
      style={{
        background: background,
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
        }}
      />
    </div>
  );
}

type TFont = {
  name: string;
  weight: number;
  style: "normal" | "italic";
  data: ArrayBuffer;
};

declare global {
  // eslint-disable-next-line no-var
  var __OG_FONTS__: readonly TFont[];
}

const bufferToArrayBuffer = (buf: Buffer): ArrayBuffer => {
  const ab = new ArrayBuffer(buf.byteLength); // guaranteed ArrayBuffer, not Shared
  new Uint8Array(ab).set(buf); // copy once
  return ab;
};

export async function getOpengraphFonts(): Promise<readonly TFont[]> {
  if (globalThis.__OG_FONTS__) return globalThis.__OG_FONTS__;

  const base = join(process.cwd(), "public/static/fonts");
  const [bold, semi, medium] = await Promise.all([
    readFile(join(base, "DMSansBold.ttf")),
    readFile(join(base, "DMSansSemiBold.ttf")),
    readFile(join(base, "DMSansMedium.ttf")),
  ]);

  const fonts: TFont[] = [
    {
      name: "dm",
      weight: 700,
      style: "normal",
      data: bufferToArrayBuffer(bold),
    },
    {
      name: "dm",
      weight: 600,
      style: "normal",
      data: bufferToArrayBuffer(semi),
    },
    {
      name: "dm",
      weight: 500,
      style: "normal",
      data: bufferToArrayBuffer(medium),
    },
  ];

  globalThis.__OG_FONTS__ = Object.freeze(fonts);
  return globalThis.__OG_FONTS__;
}

export async function DefaultOpenGraphResponse() {
  return new ImageResponse(<DefaultOpenGraphImage />, {
    ...opengraphSize,
    // @ts-expect-error - This is fine, they don't export the type so I can't set it
    fonts: await getOpengraphFonts(),
  });
}
