import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "text" | "circular" | "rounded" | "rectangular";
  lines?: number;
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, variant = "default", lines, width, height, style, ...props }: SkeletonProps) {
  const inlineStyle: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };

  if ((variant === "text") && lines && lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse rounded-md bg-gray-800",
              i === lines - 1 && "w-3/4",
              className
            )}
            style={height ? { height: typeof height === "number" ? `${height}px` : height } : undefined}
            {...props}
          />
        ))}
      </div>
    );
  }

  const isCircle = variant === "circle" || variant === "circular";

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-800",
        isCircle ? "rounded-full" : variant === "rectangular" ? "rounded-none" : "rounded-md",
        className
      )}
      style={inlineStyle}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} className="h-3" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circle" width={size} height={size} />;
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return <Skeleton lines={lines} variant="text" className={cn("h-3", className)} />;
}

export { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonText };
