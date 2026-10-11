import { Toaster as Sonner, ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border/80 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:p-3.5 group-[.toaster]:text-xs group-[.toaster]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[11px]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-emerald-500/25 group-[.toaster]:!bg-card/95 group-[.toaster]:!text-emerald-700 dark:group-[.toaster]:!text-emerald-400",
          error:
            "group-[.toaster]:!border-rose-500/25 group-[.toaster]:!bg-card/95 group-[.toaster]:!text-rose-700 dark:group-[.toaster]:!text-rose-400",
        },
      }}
      duration={3200}
      {...props}
    />
  );
}
