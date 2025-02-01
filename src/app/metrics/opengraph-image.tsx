import {
  background,
  defaultParagraphClassName,
  foreground,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import ChartColumn from "@/components/icons/chart-column";
import Logo from "@/components/logo/logo";
import { ImageResponse } from "next/og";

export const alt = "Kullanım metrikleri sayfası";
export const size = opengraphSize;
export const contentType = opengraphContentType;

const logoSize = 256;

export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: background,
          color: foreground,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          paddingLeft: 80,
          paddingRight: 80,
          paddingTop: 24,
          paddingBottom: 24,
          justifyContent: "center",
        }}
      >
        <ChartColumn
          style={{
            width: 256,
            height: 256,
            color: foreground,
            position: "absolute",
            opacity: 0.15,
            right: 64,
            bottom: 64,
          }}
        />
        <Logo
          variant="full"
          style={{
            width: logoSize,
            height: logoSize / logoAspectRatio,
            marginTop: -12,
          }}
        />
        <p
          style={{
            fontSize: 112,
            width: "100%",
            lineHeight: 1.05,
            paddingRight: 80,
            marginTop: 32,
            fontWeight: 700,
            letterSpacing: -3,
            ...defaultParagraphClassName,
          }}
        >
          Kullanım Metrikleri
        </p>
      </div>
    ),
    {
      ...size,
      // @ts-expect-error - This is fine, they don't export the type so I can't set it
      fonts: await getOpengraphFonts(),
    }
  );
}
