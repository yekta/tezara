import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/components/ui/utils";

const buttonVariants = cva(
  "relative text-center leading-tight max-w-full inline-flex items-center select-none z-0 touch-manipulation justify-center gap-2 rounded-lg font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
          "border border-input bg-background not-touch:hover:bg-border active:bg-border not-touch:hover:text-foreground active:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground not-touch:hover:bg-secondary/85 active:bg-secondary/85",
        ghost:
          "not-touch:hover:bg-border not-touch:hover:text-foreground active:bg-border active:text-foreground",
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
        default: "px-4 py-2.75",
        sm: "rounded-md px-3 py-1.5 text-sm",
        lg: "rounded-lg px-8 py-2.5",
        icon: "size-9",
      },
      state: {
        default: "",
        loading: "opacity-75 disabled:opacity-75",
      },
      fadeOnDisabled: {
        default: "",
        false: "disabled:opacity-100",
      },
      forceMinSize: {
        default:
          "before:w-full before:h-full before:min-w-[44px] before:min-h-[44px] before:z-[-1] before:bg-transparent before:absolute before:-translate-y-1/2 before:top-1/2 before:-translate-x-1/2 before:left-1/2",
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
            className,
            state,
            fadeOnDisabled,
            focusVariant,
            forceMinSize,
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
