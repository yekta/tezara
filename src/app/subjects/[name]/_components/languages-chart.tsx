"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/components/ui/utils";
import { Label, Pie, PieChart } from "recharts";

type Props = {
  chartData: { language: string; count: number }[];
  dataKeys: string[];
  className?: string;
};

export default function LanguagesChart({
  chartData,
  dataKeys,
  className,
}: Props) {
  const chartConfig = {
    count: {
      label: "Dil",
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
    <div className={cn("w-full flex flex-col gap-3", className)}>
      <h2 className="max-w-full font-bold text-balance px-4 text-xl">Diller</h2>
      <div className="w-full flex-1 flex flex-col sm:px-2">
        <div className="w-full flex flex-col bg-background-hover sm:rounded-xl">
          <div className="w-full flex flex-col justify-start items-center flex-1">
            <div className="w-full flex flex-col">
              <ChartContainer
                config={chartConfig}
                className="w-full aspect-square"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="language"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {chartData.length.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-foreground text-sm font-medium"
                              >
                                Dil
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </div>
          <div className="w-full flex items-center justify-center flex-wrap gap-1 -mt-2 pb-4 px-4">
            {dataKeys.map((k) => (
              <div
                key={k}
                className={cn(
                  "flex items-center justify-center text-xs gap-1 px-1.5 py-0.5 rounded-md"
                )}
              >
                <div
                  style={{
                    background: chartConfig[k].color,
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
