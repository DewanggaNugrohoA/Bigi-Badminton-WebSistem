import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const RIPPLE_MS = 450;

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap font-medium transition-[background-color,color,border-radius] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary/40",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 gap-2 rounded-xl px-3 text-sm data-[pressed=true]:rounded-lg",
        default: "h-10 gap-2 rounded-xl px-4 text-sm data-[pressed=true]:rounded-lg",
        lg: "h-12 gap-2 rounded-2xl px-6 text-base data-[pressed=true]:rounded-xl",
        "icon-sm": "size-8 rounded-xl data-[pressed=true]:rounded-lg",
        icon: "size-10 rounded-xl data-[pressed=true]:rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  noRipple?: boolean;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, noRipple = false, children, onPointerDown, disabled, ...props }, ref) => {
    const [pressed, setPressed] = React.useState(false);
    const layerRef = React.useRef<HTMLSpanElement>(null);
    const animated = !noRipple && !disabled && variant !== "link";

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (!animated || prefersReducedMotion()) return;
      setPressed(true);
      const layer = layerRef.current;
      if (!layer) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const diameter = Math.hypot(rect.width, rect.height) * 2;
      const dot = document.createElement("span");
      dot.style.cssText = `position:absolute;border-radius:9999px;background:currentColor;opacity:.16;pointer-events:none;width:${diameter}px;height:${diameter}px;left:${event.clientX - rect.left - diameter / 2}px;top:${event.clientY - rect.top - diameter / 2}px`;
      layer.appendChild(dot);
      const animation = dot.animate(
        [{ transform: "scale(0)", opacity: 0.16 }, { transform: "scale(1)", opacity: 0 }],
        { duration: RIPPLE_MS, easing: "cubic-bezier(0.2, 0, 0, 1)" }
      );
      animation.onfinish = () => dot.remove();
    };

    const release = () => setPressed(false);

    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        disabled={disabled}
        data-pressed={pressed || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        onPointerDown={handlePointerDown}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        {...props}
      >
        {animated && (
          <span ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
