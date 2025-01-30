"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/components/ui/utils";

export const minButtonSizeEnforcerClassName =
  "before:w-full before:h-full before:min-w-[44px] before:min-h-[44px] before:z-[-1] before:bg-transparent before:absolute before:-translate-y-1/2 before:top-1/2 before:-translate-x-1/2 before:left-1/2";

const buttonVariants = cva(
  "relative text-center leading-tight max-w-full inline-flex items-center select-none z-0 touch-manipulation justify-center gap-1.5 rounded-full font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground not-touch:hover:bg-primary/85 active:bg-primary/85",
        destructive:
          "bg-destructive text-destructive-foreground not-touch:hover:bg-destructive/85 active:bg-destructive/85",
        success:
          "bg-success text-success-foreground not-touch:hover:bg-success/85 active:bg-success/85",
        outline:
          "border border-border bg-background not-touch:hover:bg-border active:bg-border not-touch:hover:text-foreground active:text-foreground",
        "warning-outline":
          "border border-warning/25 bg-background not-touch:hover:bg-warning/20 active:bg-warning/20 not-touch:hover:border-warning/0 active:border-warning/0 text-warning not-touch:hover:text-warning active:text-warning",
        secondary:
          "bg-secondary text-secondary-foreground not-touch:hover:bg-secondary/85 active:bg-secondary/85",
        ghost:
          "not-touch:hover:bg-border not-touch:hover:text-foreground active:bg-border active:text-foreground",
        "destructive-ghost":
          "text-destructive not-touch:hover:bg-destructive/20 not-touch:hover:text-destructive active:bg-destructive/20 active:text-destructive",
        "warning-ghost":
          "text-warning not-touch:hover:bg-warning/20 not-touch:hover:text-warning active:bg-warning/20 active:text-warning",
        link: "text-primary underline-offset-4 not-touch:hover:underline active:underline",
        google:
          "bg-google text-google-foreground not-touch:hover:bg-google/85 active:bg-google/85",
        discord:
          "bg-discord text-discord-foreground not-touch:hover:bg-discord/85 active:bg-discord/85",
        github:
          "bg-github text-github-foreground not-touch:hover:bg-github/85 active:bg-github/85",
        ethereum:
          "bg-ethereum text-ethereum-foreground not-touch:hover:bg-ethereum/85 active:bg-ethereum/85",
        x: "bg-x text-x-foreground not-touch:hover:bg-x/85 active:bg-x/85",
        email:
          "bg-email text-email-foreground not-touch:hover:bg-email/85 active:bg-email/85",
      },
      size: {
        default: "px-5 py-2.75",
        sm: "px-4 py-2 text-sm",
        lg: "px-9 py-2.5",
        icon: "size-9 shrink-0",
      },
      state: {
        default: "",
        loading: "opacity-75 disabled:opacity-75",
      },
      fadeOnDisabled: {
        default: "disabled:opacity-50",
        false: "",
      },
      forceMinSize: {
        default: minButtonSizeEnforcerClassName,
        medium:
          "before:w-full before:h-full before:min-w-[36px] before:min-h-[36px] before:z-[-1] before:bg-transparent before:absolute before:-translate-y-1/2 before:top-1/2 before:-translate-x-1/2 before:left-1/2",
        false: "",
      },
      focusVariant: {
        default:
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "input-like": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
      fadeOnDisabled: "default",
      focusVariant: "default",
      forceMinSize: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export type TButtonVariants = VariantProps<typeof buttonVariants>;

export interface LinkButtonProps
  extends React.ComponentPropsWithRef<typeof Link>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      disabled,
      fadeOnDisabled,
      focusVariant,
      forceMinSize,
      state,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            state,
            fadeOnDisabled,
            focusVariant,
            forceMinSize,
            className,
          })
        )}
        ref={ref}
        disabled={state === "loading" ? true : disabled}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      className,
      variant,
      size,
      state,
      fadeOnDisabled,
      focusVariant,
      forceMinSize,
      ...props
    },
    ref
  ) => {
    return (
      <Link
        className={cn(
          buttonVariants({
            variant,
            size,
            className,
            state,
            fadeOnDisabled,
            focusVariant,
            forceMinSize,
          })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
LinkButton.displayName = "LinkButton";

export { Button, buttonVariants, LinkButton };
