"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/components/ui/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    viewportRef?: React.RefObject<HTMLDivElement>;
  }
>(({ className, viewportRef, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn(
      "relative overflow-hidden flex-1 w-full flex flex-col",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={viewportRef}
      className="flex-1 [&>div]:!block w-full rounded-[inherit]"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-[padding,background-color] group/scrollbar active:before:bg-muted-foreground/25 not-touch:hover:before:bg-muted-foreground/25 before:transition-colors",
      orientation === "vertical" &&
        "w-4 h-full before:w-[11px] before:h-full before:absolute before:right-0 before:top-0 border-l border-l-transparent p-px pl-[calc(1rem-2px-5px)] not-touch:hover:pl-[calc(1rem-2px-9px)] active:pl-[calc(1rem-2px-9px)]",
      orientation === "horizontal" &&
        "h-4 before:h-[11px] before:w-full before:absolute before:bottom-0 before:left-0 flex-col border-t border-t-transparent p-px pt-[calc(1rem-2px-5px)] not-touch:hover:pt-[calc(1rem-2px-9px)] active:pt-[calc(1rem-2px-9px)]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className="relative flex-1 rounded-full bg-muted-more-foreground transition-colors
      not-touch:group-hover/scrollbar:bg-muted-foreground group-active/scrollbar:bg-muted-foreground"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
