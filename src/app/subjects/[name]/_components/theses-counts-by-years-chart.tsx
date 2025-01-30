"use client";

import { getThesisTypeColorClassName } from "@/components/icons/sets/thesis-type";
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
  subjectName: string;
};

export default function ThesesCountsByYearsChart({
  chartData,
  dataKeys,
  className,
  subjectName,
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
    <div className={cn("w-full flex flex-col gap-3", className)}>
      <h2 className="max-w-full font-bold text-balance px-4 text-xl">
        {subjectName} Konulu Tezlerin Yıllara Göre Dağılımı
      </h2>
      <div className="w-full sm:px-2">
        <div className="w-full bg-background-hover sm:rounded-xl flex flex-col">
          <ChartContainer config={chartConfig} className="h-64">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 16, right: 16, top: 16, bottom: 16 }}
            >
              <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
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
          <div className="w-full flex items-center justify-center flex-wrap gap-1 pb-4 px-4">
            {dataKeys.map((k) => (
              <div
                key={k}
                className={cn(
                  "flex items-center justify-center text-xs gap-1 px-1.5 py-0.5 rounded-md"
                )}
              >
                <div
                  style={{
                    background: getThesisTypeColorClassName({
                      variant: k,
                      classType: "variable",
                    }),
                  }}
                  className="size-3.5 rounded"
                />
                <p className="shrink min-w-0">{k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
