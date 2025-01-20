import Logo from "@/components/logo/logo";

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

export default function DefaultOpenGraphImage({ logoSize = 220 }: Props) {
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
      <Logo
        variant="full"
        style={{
          width: logoSize,
          height: logoSize / logoAspectRatio,
        }}
      />
    </div>
  );
}

export async function getOpengraphFonts() {
  const fontBold = fetch("http://localhost:3000/fonts/DMSansBold.ttf").then(
    (r) => r.arrayBuffer()
  );
  const fontSemiBold = fetch(
    "http://localhost:3000/fonts/DMSansSemiBold.ttf"
  ).then((r) => r.arrayBuffer());
  const fontMedium = fetch("http://localhost:3000/fonts/DMSansMedium.ttf").then(
    (r) => r.arrayBuffer()
  );

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
