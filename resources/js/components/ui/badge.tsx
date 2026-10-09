import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        neutral:
          "border-border bg-muted/60 text-muted-foreground hover:bg-muted",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400",
        danger:
          "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400",
        info:
          "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
