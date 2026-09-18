import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog: React.FC<DialogPrimitive.DialogProps> = DialogPrimitive.Root as any;

const DialogTrigger: React.FC<DialogPrimitive.DialogTriggerProps> = DialogPrimitive.Trigger as any;

const DialogPortal: React.FC<DialogPrimitive.DialogPortalProps> = DialogPrimitive.Portal as any;

const DialogClose: React.FC<DialogPrimitive.DialogCloseProps> = DialogPrimitive.Close as any;

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  const OverlayPrimitive = DialogPrimitive.Overlay as any;
  return (
    <OverlayPrimitive
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...props }, ref) => {
  const ContentPrimitive = DialogPrimitive.Content as any;
  const ClosePrimitive = DialogPrimitive.Close as any;
  return (
    <DialogPortal>
      <DialogOverlay />
      <ContentPrimitive
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <ClosePrimitive className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </ClosePrimitive>
      </ContentPrimitive>
    </DialogPortal>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => {
  const TitlePrimitive = DialogPrimitive.Title as any;
  return (
    <TitlePrimitive
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => {
  const DescriptionPrimitive = DialogPrimitive.Description as any;
  return (
    <DescriptionPrimitive
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
