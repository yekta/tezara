import { cachedGetPageData } from "@/app/subjects/[name]/helpers";
import {
  DefaultOpenGraphResponse,
  foreground,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import FolderClosedIcon from "@/components/icons/folder-closed";
import GlobeIcon from "@/components/icons/globe";
import LandmarkIcon from "@/components/icons/landmark";
import PenToolIcon from "@/components/icons/pen-tool";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import Logo from "@/components/logo/logo";
import {
  OGStat,
  OGStatSectionWrapper,
  OGStatWrapper,
} from "@/components/og/og-stat";
import { OGTitle } from "@/components/og/og-title";
import OGWrapper from "@/components/og/og-wrapper";
import ImageResponse from "@takumi-rs/image-response";

export const alt = "Üniversite sayfası";
export const size = opengraphSize;
export const contentType = opengraphContentType;

type Props = {
  params: Promise<{ name: string }>;
};

const logoSize = 220;

export default async function Image({ params }: Props) {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);

  let res: Awaited<ReturnType<typeof cachedGetPageData>> | null = null;

  try {
    res = await cachedGetPageData({ name: parsedName });
  } catch (error) {
    console.log(error);
  }

  if (!res) {
    return DefaultOpenGraphResponse();
  }

  const { thesesCount, subjectStat, languages } = res;

  return new ImageResponse(
    (
      <OGWrapper>
        <FolderClosedIcon
          style={{
            width: 200,
            height: 200,
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
        <OGTitle>{parsedName}</OGTitle>
        <OGStatSectionWrapper>
          <OGStatWrapper>
            <OGStat label="Tez" value={thesesCount} Icon={ScrollTextIcon} />
            <OGStat
              label="Üniversite"
              value={subjectStat.university_count}
              Icon={LandmarkIcon}
            />
          </OGStatWrapper>
          <OGStatWrapper>
            <OGStat label="Dil" value={languages.size} Icon={GlobeIcon} />
            <OGStat
              label="Yazar"
              value={subjectStat.author_count}
              Icon={PenToolIcon}
            />
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
