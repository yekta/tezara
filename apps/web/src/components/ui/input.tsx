import * as React from "react";

import { cn } from "@/components/ui/utils";
import { cva, VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "flex px-3 font-medium placeholder:font-medium py-2.75 leading-tight w-full rounded-full border bg-input transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "",
      },
      fadeOnDisabled: {
        default: "disabled:opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      fadeOnDisabled: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, fadeOnDisabled, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({
            variant,
            fadeOnDisabled,
            className,
          })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
