import { cachedGetPageData } from "@/app/university/[name]/helpers";
import Logo from "@/components/logo/logo";
import { truncateString } from "@/lib/helpers";
import { ImageResponse } from "next/og";
import { ComponentProps, FC } from "react";

export const alt = "Üniversite sayfası";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type Props = {
  params: Promise<{ name: string }>;
};

const logoAspectRatio = 100 / 24;
const background = "hsl(0 0% 100%)";
const foreground = "hsl(250 25% 4%)";
const foregroundMuted = "hsl(250 6% 35%)";
const logoSize = 220;

export default async function Image({ params }: Props) {
  const { name } = await params;
  const parsedName = decodeURIComponent(name);

  const { thesesCount, subjects, keywords, languages } =
    await cachedGetPageData({
      name: parsedName,
    });

  const fontBold = fetch("http://localhost:3000/fonts/DMSansBold.ttf").then(
    (r) => r.arrayBuffer()
  );
  const fontSemiBold = fetch(
    "http://localhost:3000/fonts/DMSansSemiBold.ttf"
  ).then((r) => r.arrayBuffer());
  const fontMedium = fetch("http://localhost:3000/fonts/DMSansMedium.ttf").then(
    (r) => r.arrayBuffer()
  );

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
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
      fonts: [
        {
          name: "dm",
          weight: 700,
          style: "normal",
          data: await fontBold,
        },
        {
          name: "dm",
          weight: 600,
          style: "normal",
          data: await fontSemiBold,
        },
        {
          name: "dm",
          weight: 500,
          style: "normal",
          data: await fontMedium,
        },
      ],
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
