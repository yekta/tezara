import { cachedGetPageData } from "@/app/university/[name]/helpers";
import {
  background,
  foreground,
  foregroundMuted,
  getOpengraphFonts,
  logoAspectRatio,
  opengraphContentType,
  opengraphSize,
} from "@/components/default-opengraph-image";
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

  const { thesesCount, subjects, keywords, languages } =
    await cachedGetPageData({
      name: parsedName,
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
        <LandmarkIcon
          style={{
            width: 200,
            height: 200,
            color: foreground,
            position: "absolute",
            opacity: 0.2,
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
          <Stat label="Konu" value={subjects.size} Icon={FolderClosedIcon} />
          <Stat
            label="Anahtar Kelime"
            value={keywords.size}
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
}: {
  value: number;
  label: string;
  Icon?: FC<ComponentProps<"svg">>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {Icon && <Icon style={{ width: 40, height: 40 }} />}
      <p style={{ lineHeight: 1.2, fontSize: 40 }}>
        <span style={{ paddingRight: 8, fontWeight: 600 }}>
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

function GlobeIcon({ style }: ComponentProps<"svg">) {
  return (
    <svg
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function ScrollTextIcon({ style }: ComponentProps<"svg">) {
  return (
    <svg
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 12h-5" />
      <path d="M15 8h-5" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </svg>
  );
}

function FolderClosedIcon({ style }: ComponentProps<"svg">) {
  return (
    <svg
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <path d="M2 10h20" />
    </svg>
  );
}

function KeyRoundIcon({ style }: ComponentProps<"svg">) {
  return (
    <svg
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function LandmarkIcon({ style }: ComponentProps<"svg">) {
  return (
    <svg
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" x2="21" y1="22" y2="22" />
      <line x1="6" x2="6" y1="18" y2="11" />
      <line x1="10" x2="10" y1="18" y2="11" />
      <line x1="14" x2="14" y1="18" y2="11" />
      <line x1="18" x2="18" y1="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}
