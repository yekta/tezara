import { background, foreground } from "@/components/default-opengraph-image";

type TProps = {
  children: React.ReactNode;
  gap?: number;
};

export default function OGWrapper({ children, gap }: TProps) {
  return (
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
        gap: gap !== undefined ? gap : 52,
      }}
    >
      {children}
    </div>
  );
}
