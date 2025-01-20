import { cachedGetPageData } from "@/app/thesis/[id]/helpers";
import DefaultOpenGraphImage, {
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

  const notFoundResponse = async () =>
    new ImageResponse(<DefaultOpenGraphImage />, {
      ...size,
      // @ts-expect-error - This is fine, they don't export the type so I can't set it
      fonts: await getOpengraphFonts(),
    });

  try {
    const data = await cachedGetPageData({ id });
    thesis = data.thesis;
    if (!thesis) return notFoundResponse();
  } catch (error) {
    console.log(error);
    return notFoundResponse();
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
            marginTop: -12,
          }}
        />
        <p
          style={{
            fontSize: 56,
            width: "100%",
            lineHeight: 1.15,
            marginTop: 36,
            fontWeight: 700,
          }}
        >
          {truncateString(
            thesis.title_original ||
              thesis.title_translated ||
              `Tez No: ${thesis.id}`,
            100
          )}
        </p>
        <div
          style={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            gap: -20,
          }}
        >
          <Info
            label={truncateString(thesis.author || `Yazar belirtilmemiş`, 70)}
            Icon={PenTool}
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

function PenTool({ style }: ComponentProps<"svg">) {
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
      <path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" />
      <path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" />
      <path d="m2.3 2.3 7.286 7.286" />
      <circle cx="11" cy="11" r="2" />
    </svg>
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
      <p style={{ lineHeight: 1.2, fontSize: 40, color }}>{label}</p>
    </div>
  );
}
