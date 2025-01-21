import PenToolIcon from "@/components/icons/pen-tool";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import Logo from "@/components/logo/logo";
import { env } from "@/lib/env";

type Props = {
  logoSize?: number;
};

export const logoAspectRatio = 100 / 24;
export const background = "hsl(0 0% 100%)";
export const foreground = "hsl(250 25% 4%)";
export const foregroundMuted = "hsl(250 6% 35%)";

export const opengraphSize = {
  width: 1200,
  height: 630,
};
export const opengraphContentType = "image/png";

export default function DefaultOpenGraphImage({ logoSize = 500 }: Props) {
  return (
    <div
      style={{
        background: background,
        color: foreground,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ScrollTextIcon
        style={{
          color: foreground,
          opacity: 0.15,
          width: 330,
          height: 330,
          position: "absolute",
          left: -48,
          top: -72,
        }}
        strokeWidth={1.5}
      />
      <PenToolIcon
        style={{
          color: foreground,
          opacity: 0.15,
          width: 320,
          height: 320,
          position: "absolute",
          right: -40,
          bottom: -56,
          transform: "rotate(-5deg)",
        }}
        strokeWidth={1.5}
      />

      <Logo
        variant="full"
        style={{
          width: logoSize,
          height: logoSize / logoAspectRatio,
          marginTop: -34,
        }}
      />
    </div>
  );
}

export async function getOpengraphFonts() {
  const fontBold = fetch(
    `${env.NEXT_PUBLIC_SITE_URL}/static/fonts/DMSansBold.ttf`
  ).then((r) => r.arrayBuffer());
  const fontSemiBold = fetch(
    `${env.NEXT_PUBLIC_SITE_URL}/static/fonts/DMSansSemiBold.ttf`
  ).then((r) => r.arrayBuffer());
  const fontMedium = fetch(
    `${env.NEXT_PUBLIC_SITE_URL}/static/fonts/DMSansMedium.ttf`
  ).then((r) => r.arrayBuffer());

  const [fontBoldData, fontSemiBoldData, fontMediumData] = await Promise.all([
    fontBold,
    fontSemiBold,
    fontMedium,
  ]);
  return [
    {
      name: "dm",
      weight: 700,
      style: "normal",
      data: fontBoldData,
    },
    {
      name: "dm",
      weight: 600,
      style: "normal",
      data: fontSemiBoldData,
    },
    {
      name: "dm",
      weight: 500,
      style: "normal",
      data: fontMediumData,
    },
  ] as const;
}
