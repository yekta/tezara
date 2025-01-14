"use client";

import * as React from "react";
import { DayPicker, useNavigation } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/components/ui/utils";
import { format, setMonth } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown-buttons",
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      captionLayout={captionLayout}
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-2.5 text-sm font-mono", className)}
      classNames={{
        months: "w-full flex flex-col sm:flex-row",
        month: "w-full flex flex-col gap-1",
        caption:
          "w-full flex justify-center px-10 min-w-0 shrink relative items-center",
        caption_label:
          "hidden w-full text-center flex-1 overflow-hidden min-w-0 text-sm font-medium",
        caption_dropdowns: "flex-1 flex items-center gap-2",
        nav: "w-full h-full absolute pointer-events-none gap-2 flex items-center justify-between",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "w-8 h-8.5 bg-transparent p-0 rounded-md pointer-events-auto"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "w-full h-8 flex items-center justify-center",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
        row: "flex w-full flex items-center justify-center",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100 before:min-w-0 before:min-h-0"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground not-touch:hover:bg-primary not-touch:hover:text-primary-foreground active:bg-primary active:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeftIcon className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRightIcon className={cn("h-4 w-4", className)} {...props} />
        ),
        Dropdown: (p) => {
          const { goToMonth, currentMonth: currentDate } = useNavigation();

          if (p.name === "months") {
            const selectItems = Array.from({ length: 12 }, (_, i) => ({
              value: i.toString(),
              label: format(setMonth(new Date(), i), "MMMM"),
            }));
            return (
              <Select
                value={p.value?.toString()}
                onValueChange={(v) => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(parseInt(v));
                  goToMonth(newDate);
                }}
              >
                <SelectTrigger className="flex-1 px-2.5 h-8.5">
                  {format(currentDate, "MMM")}
                </SelectTrigger>
                <SelectContent className="font-mono max-h-72">
                  <SelectGroup>
                    {selectItems.map((item, index) => (
                      <SelectItem
                        key={`${item.value}-${index}`}
                        value={item.value}
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            );
          }
          if (p.name === "years") {
            const earliestYear =
              props.fromYear ||
              props.fromMonth?.getFullYear() ||
              props.fromDate?.getFullYear() ||
              1900;
            const latestYear =
              props.toYear ||
              props.fromMonth?.getFullYear() ||
              props.toDate?.getFullYear() ||
              2100;
            const selectItems = Array.from(
              { length: latestYear - earliestYear + 1 },
              (_, i) => ({
                value: (i + earliestYear).toString(),
                label: (i + earliestYear).toString(),
              })
            );

            return (
              <Select
                value={p.value?.toString()}
                onValueChange={(v) => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(parseInt(v));
                  goToMonth(newDate);
                }}
              >
                <SelectTrigger className="flex-1 px-2.5 h-8.5">
                  {currentDate.getFullYear()}
                </SelectTrigger>
                <SelectContent className="font-mono max-h-72">
                  <SelectGroup>
                    {selectItems.map((item, index) => (
                      <SelectItem
                        key={`${item.value}-${index}`}
                        value={item.value}
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            );
          }
          return null;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
