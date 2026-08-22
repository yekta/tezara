"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/components/ui/utils";
import { cva, VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    noXPadding?: boolean;
    noYPadding?: boolean;
  }
>(({ className, noXPadding, noYPadding, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-no-x-padding={noXPadding}
    data-no-y-padding={noYPadding}
    className={cn(
      "fixed flex w-full justify-center px-2 pt-12 data-[no-x-padding]:px-0 data-[no-y-padding]:py-0 pb-[calc((100vh-3rem)*0.08+2rem)] md:pb-[calc((100vh-3rem)*0.1+3rem)] overflow-auto inset-0 z-50 duration-200 data-[state=open]:duration-200 data-[state=closed]:duration-200 bg-barrier/[var(--opacity-barrier)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const dialogContentVariants = cva(
  "z-50 relative flex flex-col gap-5 w-auto max-w-full pointer-events-none duration-200 data-[state=open]:duration-200 data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-[6%] data-[state=open]:slide-in-from-bottom-[6%]",
  {
    variants: {
      variant: {
        default:
          "bg-background border rounded-xl p-5 pt-4 shadow-dialog shadow-shadow/[var(--opacity-shadow)]",
        styleless: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof dialogContentVariants> & {
      classNameInnerWrapper?: string;
      noXPadding?: boolean;
      noYPadding?: boolean;
    }
>(
  (
    {
      className,
      classNameInnerWrapper,
      variant,
      children,
      onCloseAutoFocus,
      onEscapeKeyDown,
      noXPadding,
      noYPadding,
      ...props
    },
    ref
  ) => {
    const isCloseFromKey = React.useRef<boolean>(false);

    const handleCloseAutoFocus = React.useCallback(
      (e: Event) => {
        if (onCloseAutoFocus) {
          return onCloseAutoFocus(e);
        }

        if (isCloseFromKey.current) {
          isCloseFromKey.current = false;
          return;
        }

        e.preventDefault();
      },
      [onCloseAutoFocus]
    );

    const handleEscapeKeyDown = React.useCallback(
      (e: KeyboardEvent) => {
        isCloseFromKey.current = true;
        if (onEscapeKeyDown) {
          onEscapeKeyDown(e);
        }
      },
      [onEscapeKeyDown]
    );

    return (
      <DialogPortal>
        <DialogOverlay noYPadding={noYPadding} noXPadding={noXPadding}>
          <DialogPrimitive.Content
            onCloseAutoFocus={handleCloseAutoFocus}
            onEscapeKeyDown={handleEscapeKeyDown}
            ref={ref}
            className={cn(
              "my-auto w-auto outline-none focus:outline-none",
              dialogContentVariants({ variant }),
              className
            )}
            {...props}
          >
            <div
              className={cn(
                "w-full flex flex-col gap-4",
                classNameInnerWrapper
              )}
            >
              {children}
              {variant !== "styleless" && (
                <DialogPrimitive.Close
                  className="absolute right-0 top-0 rounded-xl p-2.5 opacity-50 not-touch:hover:opacity-100 active:opacity-100 ring-1 ring-transparent 
                  focus-visible:outline-none focus-visible:ring-foreground disabled:pointer-events-none text-muted-foreground"
                >
                  <XIcon className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogOverlay>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("w-full flex flex-col gap-1", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-bold leading-tight pr-6", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground leading-snug", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
