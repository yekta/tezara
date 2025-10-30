import { cachedGetPageData } from "@/app/theses/[id]/helpers";
import {
  DefaultOpenGraphResponse,
  foreground,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
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
import { truncateString } from "@/lib/helpers";
import ImageResponse from "@takumi-rs/image-response";

export const alt = "Tez sayfası";

export const size = opengraphSize;
export const contentType = opengraphContentType;

type Props = {
  params: Promise<{ id: string }>;
};

const logoSize = 220;

export default async function Image({ params }: Props) {
  const { id } = await params;
  let thesis: Awaited<ReturnType<typeof cachedGetPageData>>["thesis"];

  try {
    const data = await cachedGetPageData({ id });
    thesis = data.thesis;
    if (!thesis) return DefaultOpenGraphResponse();
  } catch (error) {
    console.log("Error fetching thesis data for opengraph image:");
    console.log(error);
    return DefaultOpenGraphResponse();
  }

  return new ImageResponse(
    (
      <OGWrapper>
        <ScrollTextIcon
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
            marginTop: 24,
          }}
        />
        <OGTitle>
          {truncateString(
            thesis.title_original ||
              thesis.title_translated ||
              `Tez No: ${thesis.id}`,
            115
          )}
        </OGTitle>
        <OGStatSectionWrapper>
          <OGStatWrapper>
            <OGStat
              label={truncateString(thesis.author || `Yazar belirtilmemiş`, 70)}
              Icon={PenToolIcon}
            />
          </OGStatWrapper>
          <OGStatWrapper>
            <OGStat
              label={thesis.thesis_type || "Tez türü belirtilmemiş"}
              Icon={ScrollTextIcon}
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
