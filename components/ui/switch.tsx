"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, size = "md", id, ...props }, ref) => {
  const switchId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  const trackClasses = cn(
    "peer relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent",
    "transition-all duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=unchecked]:bg-gray-700",
    "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-600 data-[state=checked]:to-violet-600",
    size === "sm" && "h-5 w-9",
    size === "md" && "h-6 w-11",
    size === "lg" && "h-7 w-14",
    className
  );

  const thumbClasses = cn(
    "pointer-events-none block rounded-full bg-white shadow-lg ring-0",
    "transition-transform duration-200",
    size === "sm" && "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
    size === "md" && "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
    size === "lg" && "h-6 w-6 data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0"
  );

  if (label) {
    return (
      <div className="flex items-start gap-3">
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          className={trackClasses}
          {...props}
        >
          <SwitchPrimitive.Thumb className={thumbClasses} />
        </SwitchPrimitive.Root>
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor={switchId}
            className="text-sm font-medium text-gray-200 cursor-pointer select-none"
          >
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <SwitchPrimitive.Root ref={ref} id={switchId} className={trackClasses} {...props}>
      <SwitchPrimitive.Thumb className={thumbClasses} />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
