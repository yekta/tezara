"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/components/ui/utils";
import { truncateString } from "@/lib/helpers";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

type Props = {
  chartData: { keyword: string; count: number }[];
  dataKeys: string[];
  className?: string;
};

export default function PopularSubjectsChart({
  chartData,
  dataKeys,
  className,
}: Props) {
  const chartConfig = {
    count: {
      label: "Tez Sayısı",
    },
  } as ChartConfig;

  chartData = chartData.map((data, i) => ({
    ...data,
    fill: `hsl(var(--chart-${i + 1}))`,
  }));

  dataKeys.forEach((dataKey, index) => {
    chartConfig[dataKey] = {
      color: `hsl(var(--chart-${index + 1}))`,
      label: dataKey,
    };
  });

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <h2 className="max-w-full font-bold px-4 text-xl">Popüler Konular</h2>
      <div className="w-full sm:px-2">
        <div className="w-full bg-background-hover sm:rounded-xl flex flex-col h-128 md:h-96 lg:h-96">
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 16, right: 32, top: 12, bottom: 12 }}
            >
              <YAxis
                dataKey="keyword"
                type="category"
                tickLine={false}
                axisLine={false}
                hide
              />
              <XAxis dataKey="count" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" layout="vertical">
                <LabelList
                  dataKey="keyword"
                  position="insideLeft"
                  offset={8}
                  className="font-medium fill-[hsl(var(--background))]"
                  opacity={1}
                  fontSize={12}
                  formatter={(v: string) => truncateString(v, 40)}
                />
                <LabelList
                  dataKey="count"
                  position="right"
                  className="fill-foreground font-semibold"
                  fontSize={12}
                  formatter={(v: string) => v.toLocaleString()}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
