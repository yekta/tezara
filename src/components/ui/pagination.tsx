import { ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EllipsisIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("flex", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  (
    | (React.ComponentProps<typeof Link> & { isButton: false })
    | (React.ComponentProps<"button"> & { isButton: true })
  );

const PaginationLink = ({
  className,
  isActive,
  isButton,
  size = "sm",
  ...props
}: PaginationLinkProps) => {
  const Component = isButton ? "button" : Link;
  return (
    // @ts-expect-error - The the is not matching between button and Link
    <Component
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        "rounded-[0.55rem]",
        className
      )}
      {...props}
    />
  );
};
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  variant?: "first" | "default";
}) => (
  <PaginationLink
    aria-label={variant === "first" ? "İlk Sayfaya Git" : "Önceki Sayfaya Git"}
    size="icon"
    className={className}
    {...props}
  >
    <span className="sr-only">{variant === "first" ? "İlk" : "Önceki"}</span>
    {variant === "first" ? (
      <ChevronsLeftIcon className="size-5" />
    ) : (
      <ChevronLeftIcon className="size-5" />
    )}
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  variant?: "last" | "default";
}) => (
  <PaginationLink
    aria-label={variant === "last" ? "Son Sayfaya Git" : "Sonraki Sayfaya Git"}
    size="icon"
    className={className}
    {...props}
  >
    <span className="sr-only">
      {variant === "last" ? "Sonuncu" : "Sonraki"}
    </span>
    {variant === "last" ? (
      <ChevronsRightIcon className="size-5" />
    ) : (
      <ChevronRightIcon className="size-5" />
    )}
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <EllipsisIcon className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
