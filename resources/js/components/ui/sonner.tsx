import { Toaster as Sonner, ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-emerald-500/30 group-[.toaster]:!text-emerald-700",
          error:
            "group-[.toaster]:!border-rose-500/30 group-[.toaster]:!text-rose-700",
        },
      }}
      {...props}
    />
  );
}
