import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        home: "border-transparent bg-home/15 text-home",
        away: "border-transparent bg-away/15 text-away",
        edge: "border-transparent bg-edge/20 text-edge",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warn: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        destructive:
          "border-transparent bg-destructive/15 text-destructive dark:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
