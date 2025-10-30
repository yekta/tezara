import {
  foreground,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import ChartColumn from "@/components/icons/chart-column";
import Logo from "@/components/logo/logo";
import { OGTitle } from "@/components/og/og-title";
import OGWrapper from "@/components/og/og-wrapper";
import ImageResponse from "@takumi-rs/image-response";

export const alt = "Kullanım metrikleri sayfası";
export const size = opengraphSize;
export const contentType = opengraphContentType;

const logoSize = 256;

export default async function Image() {
  return new ImageResponse(
    (
      <OGWrapper gap={48}>
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
            marginTop: 96,
          }}
        />
        <OGTitle size="lg">
          Kullanım
          <br />
          Metrikleri
        </OGTitle>
      </OGWrapper>
    ),
    {
      ...size,
      fonts: await getOpengraphFonts(),
    }
  );
}
