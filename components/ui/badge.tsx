import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
        secondary:
          "bg-gray-700/50 text-gray-300 border border-gray-700",
        success:
          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        warning:
          "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
        danger:
          "bg-red-500/20 text-red-300 border border-red-500/30",
        info:
          "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        purple:
          "bg-violet-500/20 text-violet-300 border border-violet-500/30",
        gray:
          "bg-gray-700/50 text-gray-300 border border-gray-700",
        gradient:
          "bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-200 border border-indigo-500/30",
        outline:
          "bg-transparent text-gray-300 border border-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-emerald-400",
            variant === "warning" && "bg-yellow-400",
            variant === "danger" && "bg-red-400",
            variant === "info" && "bg-blue-400",
            variant === "purple" && "bg-violet-400",
            (!variant || variant === "default" || variant === "gradient") && "bg-indigo-400",
            (variant === "gray" || variant === "secondary" || variant === "outline") && "bg-gray-400"
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
