import { defaultParagraphClassName } from "@/components/default-opengraph-image";
import { truncateString } from "@/lib/helpers";

export function OGTitle({
  size = "md",
  children,
}: {
  size?: "md" | "lg";
  children: React.ReactNode;
}) {
  return (
    <p
      style={{
        fontSize: size === "lg" ? 128 : 64,
        width: "100%",
        lineHeight: 1.05,
        marginTop: 0,
        fontWeight: 700,
        ...defaultParagraphClassName,
      }}
    >
      {typeof children === "string" ? truncateString(children, 70) : children}
    </p>
  );
}
