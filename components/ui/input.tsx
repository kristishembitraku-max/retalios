"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftAdornment,
      rightAdornment,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-300 select-none"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-400" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAdornment && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
              {leftAdornment}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "w-full rounded-lg bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500",
              "px-3.5 py-2.5 text-sm",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error &&
                "border-red-500 focus:ring-red-500",
              leftAdornment && "pl-10",
              rightAdornment && "pr-10",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {rightAdornment && (
            <div className="absolute right-3 flex items-center text-gray-400">
              {rightAdornment}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-400 flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
