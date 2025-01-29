import { cachedGetPageData } from "@/app/thesis/[id]/helpers";
import {
  background,
  DefaultOpenGraphResponse,
  defaultParagraphClassName,
  foreground,
  foregroundMuted,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import PenToolIcon from "@/components/icons/pen-tool";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import Logo from "@/components/logo/logo";
import { truncateString } from "@/lib/helpers";
import { ImageResponse } from "next/og";
import { ComponentProps, FC } from "react";

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
    console.log(error);
    return DefaultOpenGraphResponse();
  }

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
          }}
        />
        <p
          style={{
            fontSize: 56,
            width: "100%",
            lineHeight: 1.15,
            marginTop: 36,
            fontWeight: 700,
            ...defaultParagraphClassName,
          }}
        >
          {truncateString(
            thesis.title_original ||
              thesis.title_translated ||
              `Tez No: ${thesis.id}`,
            115
          )}
        </p>
        <div
          style={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            marginTop: 8,
            gap: -20,
          }}
        >
          <Info
            label={truncateString(thesis.author || `Yazar belirtilmemiş`, 70)}
            Icon={PenToolIcon}
          />
          <Info
            label={thesis.thesis_type || "Tez türü belirtilmemiş"}
            Icon={ScrollTextIcon}
          />
        </div>
      </div>
    ),
    {
      ...size,
      // @ts-expect-error - This is fine, they don't export the type so I can't set it
      fonts: await getOpengraphFonts(),
    }
  );
}

function Info({
  label,
  Icon,
  color = foregroundMuted,
}: {
  label: string;
  Icon?: FC<ComponentProps<"svg">>;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {Icon && <Icon style={{ width: 40, height: 40, color }} />}
      <p
        style={{
          lineHeight: 1.2,
          fontSize: 40,
          color,
          ...defaultParagraphClassName,
        }}
      >
        {label}
      </p>
    </div>
  );
}
