"use client";

import { getThesisTypeColorClassName } from "@/components/icons/thesis-type";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/components/ui/utils";
import { Bar, BarChart, XAxis } from "recharts";

type Props = {
  chartData: {
    [key: string]: string;
  }[];
  dataKeys: string[];
  className?: string;
};

export default function ThesesCountsByYearsChart({
  chartData,
  dataKeys,
  className,
}: Props) {
  const chartConfig = {} as ChartConfig;

  dataKeys.forEach((dataKey) => {
    chartConfig[dataKey] = {
      color: getThesisTypeColorClassName(dataKey, true),
      label: dataKey,
    };
  });

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <h2 className="font-bold px-4 text-xl">Yıllara Göre Tez Sayıları</h2>
      <div className="w-full px-1 md:px-3">
        <div className="w-full px-3 md:px-4 py-1.5 rounded-lg border flex flex-col">
          <ChartContainer config={chartConfig} className="h-64">
            <BarChart accessibilityLayer data={chartData}>
              <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {dataKeys.map((dataKey) => (
                <Bar
                  key={dataKey}
                  dataKey={dataKey}
                  fill={chartConfig[dataKey].color}
                  radius={0}
                  stackId="a"
                ></Bar>
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
