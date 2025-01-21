"use client";

import { getThesisTypeColorClassName } from "@/components/icons/sets/thesis-type";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/components/ui/utils";
import { Label, Pie, PieChart } from "recharts";

type Props = {
  chartData: { thesisType: string; count: number }[];
  dataKeys: string[];
  className?: string;
};

export default function ThesisTypesChart({
  chartData,
  dataKeys,
  className,
}: Props) {
  const chartConfig = {
    count: {
      label: "Tez Türü",
    },
  } as ChartConfig;

  chartData = chartData.map((data) => ({
    ...data,
    fill: getThesisTypeColorClassName({
      variant: data.thesisType,
      classType: "variable",
    }),
  }));

  dataKeys.forEach((dataKey, index) => {
    chartConfig[dataKey] = {
      color: `hsl(var(--chart-${index + 1}))`,
      label: dataKey,
    };
  });

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <h2 className="max-w-full font-bold px-4 text-xl">Tez Türleri</h2>
      <div className="w-full sm:px-2">
        <div className="w-full flex flex-col">
          <ChartContainer
            config={chartConfig}
            className="w-full bg-background-hover sm:rounded-xl aspect-square"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="thesisType"
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
                            Tez Türü
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
    </div>
  );
}
