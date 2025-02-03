import BroomIcon from "@/components/icons/broom";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/components/ui/utils";
import {
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { ComponentType, ReactNode, useRef } from "react";

type Props = {
  items: { label: string; value: string }[];
  isItemSelected: (v: string) => boolean;
  onSelect: (v: string) => void;
  onClearButtonClick?: () => void;
  clearLength?: number;
  commandEmptyText: string;
  commandErrorText?: string;
  commandButtonText: ReactNode | string;
  commandInputValue?: string;
  commandInputPlaceholder: string;
  commandInputOnValueChange?: (v: string) => void;
  commandFilter?:
    | ((
        value: string,
        search: string,
        keywords?: string[] | undefined
      ) => number)
    | undefined;
  triggerOnClick?: () => void;
  className?: string;
  Icon?: ComponentType<{ className: string }>;
  IconSetForItem?: ComponentType<{ className: string; variant: string }>;
  iconSetForItemClassName?: string;
  label: string;
  isAsync?: boolean;
  isPending?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  hasNext?: boolean;
  toLoadMoreText?: string;
};

export default function MultiSelectCombobox({
  items,
  isItemSelected,
  onSelect,
  onClearButtonClick,
  clearLength,
  Icon,
  IconSetForItem,
  iconSetForItemClassName,
  commandButtonText,
  commandEmptyText,
  commandErrorText = "Something went wrong",
  commandInputValue,
  commandInputPlaceholder,
  commandInputOnValueChange,
  commandFilter,
  triggerOnClick,
  label,
  className,
  isAsync = false,
  isPending = false,
  isFetching = false,
  isError = false,
  hasNext = false,
  toLoadMoreText,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollId = useRef<NodeJS.Timeout | undefined>(undefined);

  const hasClearButton =
    clearLength !== undefined &&
    clearLength > 0 &&
    onClearButtonClick !== undefined;

  return (
    <div
      data-has-clean={hasClearButton ? true : undefined}
      className={cn(
        "w-full max-w-full group flex flex-col relative",
        className
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label={label}
            variant="outline"
            size="sm"
            role="combobox"
            onClick={triggerOnClick}
            className={cn(
              "w-full justify-between rounded-lg px-3 group-data-[has-clean]:pr-12"
            )}
          >
            <div className="flex shrink min-w-0 items-center gap-1.5">
              {Icon && (
                <Icon className="leading-none -my-1 size-4 shrink-0 -ml-0.5" />
              )}
              {typeof commandButtonText === "string" ? (
                <p className="shrink min-w-0 whitespace-nowrap overflow-hidden overflow-ellipsis">
                  {commandButtonText}
                </p>
              ) : (
                commandButtonText
              )}
            </div>
            <ChevronDownIcon className="size-4 shrink-0 opacity-50 -mr-1" />
          </Button>
        </PopoverTrigger>
        {hasClearButton && (
          <div className="absolute top-0 z-50 rounded-r-lg bg-background h-full flex right-0">
            <Button
              aria-label={`Temizle: ${clearLength}`}
              onClick={onClearButtonClick}
              variant="warning-outline"
              type="button"
              className="w-9.5 h-full p-0 overflow-hidden flex items-center justify-center rounded-lg rounded-l-none gap-1.5 text-warning"
            >
              <BroomIcon className="size-5" />
            </Button>
          </div>
        )}
        <PopoverContent className="p-0">
          <Command
            filter={commandFilter}
            className="max-h-[min(20rem,var(--radix-popper-available-height))]"
          >
            <CommandInput
              value={commandInputValue}
              onValueChange={(v) => {
                commandInputOnValueChange?.(v);
                clearTimeout(scrollId.current);
                scrollId.current = setTimeout(() => {
                  const div = listRef.current;
                  div?.scrollTo({ top: 0 });
                });
              }}
              showSpinner={isFetching}
              placeholder={commandInputPlaceholder}
            />
            <ScrollArea viewportRef={listRef}>
              <CommandList>
                {(!isAsync || (isAsync && !isPending && !isError)) && (
                  <CommandEmpty className="text-muted-foreground text-sm font-medium text-center px-4 py-6">
                    <div className="w-full flex flex-col items-center justify-center gap-0.5">
                      <SearchIcon className="size-6" />
                      {commandEmptyText}
                    </div>
                  </CommandEmpty>
                )}
                {isAsync && isError && (
                  <CommandEmpty className="text-destructive text-sm font-semibold text-center px-4 py-6">
                    <div className="w-full flex flex-col items-center justify-center gap-0.5">
                      <TriangleAlertIcon className="size-6" />
                      {commandErrorText}
                    </div>
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {!isError &&
                    items.map((item) => (
                      <CommandItem
                        value={item.label}
                        key={item.value}
                        onSelect={onSelect}
                        className="flex justify-between gap-2 py-2 group/item"
                        data-pending={isPending ? true : undefined}
                        disabled={isPending}
                      >
                        <div className="flex shrink min-w-0 items-center gap-2">
                          {!isPending && IconSetForItem && (
                            <IconSetForItem
                              className={cn(
                                "leading-none size-4 -my-1 -ml-0.25",
                                iconSetForItemClassName
                              )}
                              variant={item.value}
                            />
                          )}
                          <p
                            className="shrink min-w-0 overflow-hidden overflow-ellipsis leading-tight 
                            group-data-[pending]/item:text-transparent group-data-[pending]/item:bg-foreground group-data-[pending]/item:animate-skeleton
                            group-data-[pending]/item:rounded-sm"
                          >
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
              {hasNext && toLoadMoreText && (
                <div className="w-full border-t flex items-center justify-center px-4 py-3 gap-1.5 text-muted-foreground text-sm font-medium">
                  <SearchIcon className="size-4 shrink-0" />
                  <p className="shrink min-w-0 text-balance leading-tight">
                    {toLoadMoreText}
                  </p>
                </div>
              )}
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
