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
      color: getThesisTypeColorClassName({
        variant: dataKey,
        classType: "variable",
      }),
      label: dataKey,
    };
  });

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <h2 className="max-w-full font-bold px-4 text-xl">
        Yıllara Göre Tez Sayıları
      </h2>
      <div className="w-full sm:px-2">
        <div className="w-full bg-background-hover sm:rounded-xl flex flex-col">
          <ChartContainer config={chartConfig} className="h-64">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
            >
              <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {dataKeys.map((dataKey) => {
                return (
                  <Bar
                    key={dataKey}
                    dataKey={dataKey}
                    fill={chartConfig[dataKey].color}
                    stackId="a"
                  ></Bar>
                );
              })}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
