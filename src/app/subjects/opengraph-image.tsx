import {
  background,
  defaultParagraphClassName,
  foreground,
  foregroundMuted,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
import FolderClosedIcon from "@/components/icons/folder-closed";
import Logo from "@/components/logo/logo";
import { apiServerStatic } from "@/server/trpc/setup/server";
import { ImageResponse } from "next/og";
import { ComponentProps, FC } from "react";

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
            marginTop: -12,
          }}
        />
        <p
          style={{
            fontSize: 128,
            width: "100%",
            lineHeight: 1.2,
            marginTop: 32,
            fontWeight: 700,
            letterSpacing: -3,
            ...defaultParagraphClassName,
          }}
        >
          Konular
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            fontSize: 32,
            marginTop: -24,
            fontWeight: 500,
          }}
        >
          <Stat label="Konu" value={totalCount} Icon={FolderClosedIcon} />
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
