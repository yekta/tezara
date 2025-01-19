"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/components/ui/utils";
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
      <h2 className="font-bold px-4 text-xl">Popüler Konular</h2>
      <div className="w-full px-1 md:px-3">
        <div className="w-full px-2.5 py-2 rounded-lg border flex flex-col h-128 md:h-96 lg:h-96">
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData} layout="vertical">
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
                />
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={8}
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
