import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/components/ui/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { ComponentType, ReactNode, useRef } from "react";

type Props = {
  items: { label: string; value: string }[];
  isItemSelected: (v: string) => boolean;
  onSelect: (v: string) => void;
  commandEmptyText: string;
  commandButtonText: ReactNode | string;
  commandInputPlaceholder: string;
  className?: string;
  Icon?: ComponentType<{ className: string }>;
  IconSetForItem?: ComponentType<{ className: string; variant: string }>;
  iconSetForItemClassName?: string;
};

export default function MultiSelectFormItem({
  items,
  isItemSelected,
  onSelect,
  Icon,
  IconSetForItem,
  iconSetForItemClassName,
  commandButtonText,
  commandEmptyText,
  commandInputPlaceholder,
  className,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollId = useRef<NodeJS.Timeout | undefined>(undefined);

  return (
    <FormItem className={cn("w-full max-w-full flex flex-col", className)}>
      <FormLabel className="sr-only">Dil</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              size="sm"
              role="combobox"
              className={cn("w-full justify-between rounded-lg px-3")}
            >
              <div className="flex shrink min-w-0 items-center gap-1.5">
                {Icon && <Icon className="size-4 shrink-0 -ml-0.5" />}
                <p className="shrink min-w-0 whitespace-nowrap overflow-hidden overflow-ellipsis">
                  {commandButtonText}
                </p>
              </div>
              <ChevronDownIcon className="size-4 shrink-0 opacity-50 -mr-1" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command className="max-h-[min(20rem,var(--radix-popper-available-height))]">
            <CommandInput
              onValueChange={() => {
                clearTimeout(scrollId.current);
                scrollId.current = setTimeout(() => {
                  const div = listRef.current;
                  div?.scrollTo({ top: 0 });
                });
              }}
              placeholder={commandInputPlaceholder}
              className="py-2"
              classNameWrapper="px-2"
            />
            <ScrollArea viewportRef={listRef}>
              <CommandList>
                <CommandEmpty>{commandEmptyText}</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      value={item.label}
                      key={item.value}
                      onSelect={onSelect}
                      className="flex justify-between gap-2"
                    >
                      <div className="flex shrink min-w-0 items-center gap-2">
                        {IconSetForItem && (
                          <IconSetForItem
                            className={cn(
                              "size-4 -ml-0.25",
                              iconSetForItemClassName
                            )}
                            variant={item.value}
                          />
                        )}
                        <p className="shrink min-w-0 overflow-hidden overflow-ellipsis leading-tight">
                          {item.label}
                        </p>
                      </div>
                      <CheckIcon
                        strokeWidth={3}
                        className={cn(
                          "size-4",
                          isItemSelected(item.value)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
    </FormItem>
  );
}
