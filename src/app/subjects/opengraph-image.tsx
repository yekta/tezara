import {
  foreground,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import FolderClosedIcon from "@/components/icons/folder-closed";
import Logo from "@/components/logo/logo";
import {
  OGStat,
  OGStatSectionWrapper,
  OGStatWrapper,
} from "@/components/og/og-stat";
import { OGTitle } from "@/components/og/og-title";
import OGWrapper from "@/components/og/og-wrapper";
import { apiServerStatic } from "@/server/trpc/setup/server";
import ImageResponse from "@takumi-rs/image-response";

export const alt = "Konular sayfası";
export const size = opengraphSize;
export const contentType = opengraphContentType;

const logoSize = 256;

export default async function Image() {
  const { totalCount } = await apiServerStatic.main.getSubjects({
    page: 1,
  });
  return new ImageResponse(
    (
      <OGWrapper gap={48}>
        <FolderClosedIcon
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
          }}
        />
        <OGTitle size="lg">Konular</OGTitle>
        <OGStatSectionWrapper marginTop={-72}>
          <OGStatWrapper>
            <OGStat label="Konu" value={totalCount} Icon={FolderClosedIcon} />
          </OGStatWrapper>
        </OGStatSectionWrapper>
      </OGWrapper>
    ),
    {
      ...size,
      fonts: await getOpengraphFonts(),
    }
  );
}
