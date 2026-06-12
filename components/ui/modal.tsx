"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Simple Modal (imperative open/close) ─────────────────────────────────────

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-screen-lg",
};

function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showClose = true,
  size = "md",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-full",
                  sizeClasses[size],
                  "bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/50",
                  "p-6 focus:outline-none",
                  className
                )}
                style={{ x: "-50%", y: "-50%" }}
                initial={{ opacity: 0, scale: 0.95, y: "-48%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, y: "-48%" }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {(title || showClose) && (
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1 pr-8">
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-white">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-sm text-gray-400">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>

                    {showClose && (
                      <Dialog.Close
                        className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function ModalTrigger({ children }: { children: React.ReactNode }) {
  return <Dialog.Trigger asChild>{children}</Dialog.Trigger>;
}

function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Composable Modal (Radix primitives) ─────────────────────────────────────

const ModalRoot = Dialog.Root;
const ModalClose = Dialog.Close;
const ModalPortal = Dialog.Portal;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = Dialog.Overlay.displayName;

interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
}

const ModalContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  ModalContentProps
>(({ className, children, size = "md", showClose = true, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
        "bg-gray-900 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50",
        "w-full focus:outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "duration-200",
        sizeClasses[size ?? "md"],
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <Dialog.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      )}
    </Dialog.Content>
  </ModalPortal>
));
ModalContent.displayName = Dialog.Content.displayName;

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 pt-6 pb-4 border-b border-white/[0.06]", className)}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";

const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 py-5", className)} {...props} />
));
ModalBody.displayName = "ModalBody";

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn("text-xl font-semibold text-white leading-tight", className)}
    {...props}
  />
));
ModalTitle.displayName = Dialog.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn("text-sm text-gray-400 mt-1", className)}
    {...props}
  />
));
ModalDescription.displayName = Dialog.Description.displayName;

export {
  Modal,
  ModalTrigger,
  ModalFooter,
  ModalRoot,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalTitle,
  ModalDescription,
};
