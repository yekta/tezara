import {
  defaultParagraphClassName,
  foregroundMuted,
} from "@/components/default-opengraph-image";
import { ComponentProps, FC } from "react";

export function OGStat({
  value,
  label,
  Icon,
  color = foregroundMuted,
}: {
  value?: number;
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
        style={{
          lineHeight: 1.2,
          fontSize: 40,
          ...defaultParagraphClassName,
        }}
      >
        {value !== undefined && (
          <span style={{ paddingRight: 8, fontWeight: 700, color }}>
            {value.toLocaleString("tr")}{" "}
          </span>
        )}
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

export function OGStatWrapper({
  marginTop,
  children,
}: {
  marginTop?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        fontSize: 32,
        fontWeight: 500,
        marginTop: marginTop !== undefined ? marginTop : -100,
      }}
    >
      {children}
    </div>
  );
}

export function OGStatSectionWrapper({
  children,
  marginTop,
}: {
  children: React.ReactNode;
  marginTop?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        marginTop,
      }}
    >
      {children}
    </div>
  );
}
