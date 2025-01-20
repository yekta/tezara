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
import { ComponentProps } from "react";

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
            130
          )}
        </p>
        <p
          style={{
            fontSize: 40,
            width: "100%",
            lineHeight: 1.1,
            marginTop: 20,
            fontWeight: 500,
            color: foregroundMuted,
          }}
        >
          {truncateString(thesis.author || `Yazar belirtilmemiş`, 70)}
        </p>
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
