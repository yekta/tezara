import { cachedGetPageData } from "@/app/universities/[name]/helpers";
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
import FolderClosedIcon from "@/components/icons/folder-closed";
import GlobeIcon from "@/components/icons/globe";
import KeyRoundIcon from "@/components/icons/key-round";
import LandmarkIcon from "@/components/icons/landmark";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import Logo from "@/components/logo/logo";
import { truncateString } from "@/lib/helpers";
import { ImageResponse } from "next/og";
import { ComponentProps, FC } from "react";

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

  const { thesesCount, subjects, universityStats, languages } = res;

  return new ImageResponse(
    (
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
        <LandmarkIcon
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
            marginTop: -12,
          }}
        />
        <p
          style={{
            fontSize: 64,
            width: "100%",
            lineHeight: 1.2,
            marginTop: 36,
            fontWeight: 700,
            ...defaultParagraphClassName,
          }}
        >
          {truncateString(parsedName, 70)}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            fontSize: 32,
            marginTop: -8,
            fontWeight: 500,
          }}
        >
          <Stat label="Tez" value={thesesCount} Icon={ScrollTextIcon} />
          <Stat label="Dil" value={languages.size} Icon={GlobeIcon} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            marginTop: -28,
          }}
        >
          <Stat label="Konular" value={subjects.size} Icon={FolderClosedIcon} />
          <Stat
            label="Anahtar Kelime"
            value={universityStats.keyword_count_turkish}
            Icon={KeyRoundIcon}
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

function Stat({
  value,
  label,
  Icon,
  color = foregroundMuted,
}: {
  value: number;
  label: string;
  Icon?: FC<ComponentProps<"svg">>;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {Icon && <Icon style={{ width: 40, height: 40, color }} />}
      <p
        style={{ lineHeight: 1.2, fontSize: 40, ...defaultParagraphClassName }}
      >
        <span style={{ paddingRight: 8, fontWeight: 700, color }}>
          {value.toLocaleString("tr")}
        </span>
        <span
          style={{
            color: foregroundMuted,
          }}
        >
          {label}
        </span>
      </p>
    </div>
  );
}
