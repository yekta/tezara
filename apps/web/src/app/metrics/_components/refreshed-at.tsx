"use client";

import { useState } from "react";
import { useInterval } from "usehooks-ts";

type Props = {
  timestamp: number;
};

const rtf = new Intl.RelativeTimeFormat("tr", {
  numeric: "auto",
  style: "short",
});

export default function RefreshedAt({ timestamp }: Props) {
  const [differenceMs, setDifferenceMs] = useState(timestamp - Date.now());

  const differenceHours = Math.ceil(differenceMs / 1000 / 60 / 60);
  const differenceMinutes = Math.ceil(differenceMs / 1000 / 60);
  const differenceSeconds = Math.ceil(differenceMs / 1000);

  const diffHoursStr = rtf.format(differenceHours, "hours");
  const diffMinutesStr = rtf.format(differenceMinutes, "minutes");
  const diffSecondsStr = rtf.format(differenceSeconds, "seconds");

  const differenceStr =
    Math.abs(differenceHours) >= 1
      ? diffHoursStr
      : Math.abs(differenceMinutes) >= 1
      ? diffMinutesStr
      : diffSecondsStr;

  useInterval(() => {
    const diff = timestamp - Date.now();
    setDifferenceMs(diff);
  }, 1000);

  return (
    <p className="w-full text-muted-foreground font-medium text-sm px-4 pt-1">
      Son güncelleme: {differenceStr}
    </p>
  );
}
