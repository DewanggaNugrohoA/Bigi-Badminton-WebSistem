"use client";

/**
 * Navigation Menu, Base UI Navigation Menu foundation (Phase 5).
 * Shared overlay surface (Portal/Positioner/Popup/Viewport) is rendered
 * by the Root wrapper; per-item Content mounts inside the shared Viewport.
 *
 * Panels use solid `--primitive-surface-overlay` + `--primitive-shadow-overlay`
 * + `--primitive-radius-surface`. Item hover uses `--primitive-surface-hover`,
 * descriptions the muted-foreground role. Positioner: z `--primitive-z-popover`,
 * collisionPadding 12. Viewport transition CSS-driven and RM-gated.
 *
 * D-17: asChild patterns migrated to Base UI's `render` prop.
 *
 * Sub-menu family (Sub / SubTrigger / SubContent) stays custom, Base UI
 * Navigation Menu has no built-in submenu API. Preserved for API compat.
 */

import * as React from "react";
import { NavigationMenu as BaseNav } from "@base-ui/react/navigation-menu";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type NavigationMenuSize = "default" | "compact";
export type NavigationMenuAlign = "start" | "center" | "end";

export interface NavigationMenuProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof BaseNav.Root>,
    "value" | "defaultValue" | "onValueChange" | "delay"
  > {
  size?: NavigationMenuSize;
  /** Delay in ms before opening a menu on hover. Default 120. */
  delayDuration?: number;
  /**
   * @deprecated Base UI owns the hover bridge/close timing; kept for API compat.
   */
  skipDelayOnSwitch?: boolean;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export type NavigationMenuListProps = React.ComponentPropsWithoutRef<typeof BaseNav.List>;

export type NavigationMenuItemProps = React.ComponentPropsWithoutRef<typeof BaseNav.Item>;

export interface NavigationMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof BaseNav.Trigger> {
  /** Whether to show a chevron indicator. Default true. */
  showChevron?: boolean;
}

export interface NavigationMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof BaseNav.Content> {
  /** Force a specific width. Use for mega menus (e.g. "w-[48rem]"). */
  width?: string;
  /**
   * @deprecated Base UI Navigation Menu uses a shared Viewport with
   * automatic alignment; per-content align is not supported.
   */
  align?: NavigationMenuAlign;
}

export interface NavigationMenuLinkProps
  extends React.ComponentPropsWithoutRef<typeof BaseNav.Link> {
  asChild?: boolean;
}

export type NavigationMenuIconProps = React.ComponentPropsWithoutRef<typeof BaseNav.Icon>;

export type NavigationMenuDescriptionProps = React.HTMLAttributes<HTMLSpanElement>;

export interface NavigationMenuSubProps {
  children: React.ReactNode;
}

export type NavigationMenuSubTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export type NavigationMenuSubContentProps = React.HTMLAttributes<HTMLDivElement>;

export type NavigationMenuGroupProps = React.HTMLAttributes<HTMLDivElement>;

export type NavigationMenuGroupHeadingProps = React.HTMLAttributes<HTMLHeadingElement>;

const NavigationMenuSizeContext =
  React.createContext<NavigationMenuSize>("default");
const useNavSize = () => React.useContext(NavigationMenuSizeContext);

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const overlaySurfaceClass = cn(
  "border border-[var(--border)] bg-[color:var(--primitive-surface-overlay,var(--popover))] text-[var(--foreground)]",
  "[box-shadow:var(--primitive-shadow-overlay,0_1px_2px_rgba(0,0,0,0.08),0_18px_48px_-24px_rgba(0,0,0,0.4))]",
);

const popupMotionClass = cn(
  "origin-[var(--transform-origin)] transform-gpu outline-none",
  "transition-[opacity,scale] duration-[180ms] ease-[var(--primitive-ease,cubic-bezier(0.23,1,0.32,1))]",
  "data-[ending-style]:duration-[120ms]",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
  "data-[starting-style]:scale-[0.96] data-[ending-style]:scale-[0.96]",
  "motion-reduce:transition-none motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100",
);

const viewportMotionClass = cn(
  "relative overflow-hidden",
  "transition-[width,height] duration-[220ms] ease-[var(--primitive-ease,cubic-bezier(0.23,1,0.32,1))]",
  "motion-reduce:transition-none",
);

export const NavigationMenu = React.forwardRef<
  HTMLElement,
  NavigationMenuProps
>(function NavigationMenu(
  {
    size = "default",
    delayDuration = 120,
    skipDelayOnSwitch: _skipDelayOnSwitch,
    value: valueProp,
    defaultValue,
    onValueChange,
    className,
    children,
    "aria-label": ariaLabel = "Main navigation",
    ...props
  },
  ref,
) {
  const handleValueChange = React.useMemo(
    () =>
      onValueChange
        ? (v: unknown) => onValueChange((v ?? null) as string | null)
        : undefined,
    [onValueChange],
  );

  return (
    <NavigationMenuSizeContext.Provider value={size}>
      <BaseNav.Root data-wensity-primitive=""
        ref={ref as React.Ref<HTMLElement>}
        delay={delayDuration}
        value={valueProp as never}
        defaultValue={defaultValue as never}
        onValueChange={handleValueChange as never}
        data-size={size}
        aria-label={ariaLabel}
        className={cn("relative", className)}
        {...props}
      >
        {children}
        <BaseNav.Portal>
          <BaseNav.Positioner
            collisionPadding={12}
            sideOffset={8}
            className="z-[var(--primitive-z-popover,130)] outline-none"
          >
            <BaseNav.Popup data-wensity-primitive=""
              className={cn(
                overlaySurfaceClass,
                "rounded-[var(--primitive-radius-surface,1rem)]",
                popupMotionClass,
              )}
            >
              <BaseNav.Viewport className={viewportMotionClass} />
            </BaseNav.Popup>
          </BaseNav.Positioner>
        </BaseNav.Portal>
      </BaseNav.Root>
    </NavigationMenuSizeContext.Provider>
  );
});

export const NavigationMenuList = React.forwardRef<
  HTMLUListElement,
  NavigationMenuListProps
>(function NavigationMenuList({ className, ...props }, ref) {
  const size = useNavSize();
  return (
    <BaseNav.List
      ref={ref}
      className={cn(
        "flex list-none items-center",
        size === "compact" ? "gap-0.5" : "gap-1",
        className,
      )}
      {...props}
    />
  );
});

export const NavigationMenuItem = React.forwardRef<
  HTMLLIElement,
  NavigationMenuItemProps
>(function NavigationMenuItem({ className, ...props }, ref) {
  return (
    <BaseNav.Item
      ref={ref}
      className={cn("relative", className)}
      {...props}
    />
  );
});

export const NavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  NavigationMenuTriggerProps
>(function NavigationMenuTrigger(
  { className, showChevron = true, children, ...props },
  ref,
) {
  const size = useNavSize();
  return (
    <BaseNav.Trigger
      ref={ref}
      className={cn(
        "group/nav-item relative inline-flex select-none items-center gap-1.5 rounded-[var(--primitive-radius-item,0.625rem)] font-medium outline-none",
        "transition-colors duration-100 ease-out motion-reduce:transition-none",
        "text-[color:var(--primitive-text-secondary,color-mix(in_srgb,var(--foreground)_72%,transparent))]",
        "hover:text-[var(--foreground)] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))]",
        "data-[popup-open]:text-[var(--foreground)]",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))]",
        "active:scale-[0.97] motion-reduce:active:scale-100",
        size === "compact"
          ? "px-2.5 py-1.5 text-[13px]"
          : "px-3 py-2 text-[14px]",
        className,
      )}
      {...props}
    >
      {children}
      {showChevron && (
        <IconChevronDown
          size={size === "compact" ? 12 : 14}
          stroke={2}
          className={cn(
            "shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ease-out motion-reduce:transition-none",
            "group-data-[popup-open]/nav-item:rotate-180",
          )}
        />
      )}
    </BaseNav.Trigger>
  );
});

export const NavigationMenuContent = React.forwardRef<
  HTMLDivElement,
  NavigationMenuContentProps
>(function NavigationMenuContent(
  { className, width, align: _align, children, ...props },
  ref,
) {
  return (
    <BaseNav.Content data-wensity-primitive=""
      ref={ref}
      className={cn("outline-none p-3", width, className)}
      {...props}
    >
      {children}
    </BaseNav.Content>
  );
});

export const NavigationMenuLink = React.forwardRef<
  HTMLAnchorElement,
  NavigationMenuLinkProps
>(function NavigationMenuLink(
  { className, asChild, active, children, ...props },
  ref,
) {
  const size = useNavSize();
  const linkClass = cn(
    "group/nav-link inline-flex select-none items-center gap-1.5 rounded-[var(--primitive-radius-item,0.625rem)] font-medium outline-none",
    "transition-colors duration-100 ease-out motion-reduce:transition-none",
    "text-[color:var(--primitive-text-secondary,color-mix(in_srgb,var(--foreground)_72%,transparent))]",
    "hover:text-[var(--foreground)] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))]",
    "data-[active]:text-[var(--foreground)]",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))]",
    "active:scale-[0.97] motion-reduce:active:scale-100",
    size === "compact"
      ? "px-2.5 py-1.5 text-[13px]"
      : "px-3 py-2 text-[14px]",
    className,
  );

  if (asChild && React.isValidElement(children)) {
    return (
      <BaseNav.Link
        ref={ref}
        active={active}
        render={children as React.ReactElement}
        className={linkClass}
        {...props}
      />
    );
  }

  return (
    <BaseNav.Link
      ref={ref}
      active={active}
      className={linkClass}
      {...props}
    >
      {children}
    </BaseNav.Link>
  );
});

export const NavigationMenuIcon = React.forwardRef<
  HTMLSpanElement,
  NavigationMenuIconProps
>(function NavigationMenuIcon({ className, ...props }, ref) {
  const size = useNavSize();
  return (
    <BaseNav.Icon
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-[var(--muted-foreground)]",
        "group-hover/nav-item:text-[var(--foreground)] group-hover/nav-link:text-[var(--foreground)] transition-colors duration-100 motion-reduce:transition-none",
        size === "compact" ? "size-4" : "size-5",
        className,
      )}
      {...props}
    />
  );
});

export const NavigationMenuDescription = React.forwardRef<
  HTMLSpanElement,
  NavigationMenuDescriptionProps
>(function NavigationMenuDescription({ className, ...props }, ref) {
  const size = useNavSize();
  return (
    <span
      ref={ref}
      className={cn(
        "block text-[var(--muted-foreground)] leading-snug",
        "group-hover/nav-link:text-[color:var(--primitive-text-secondary,color-mix(in_srgb,var(--foreground)_72%,transparent))] transition-colors duration-100 motion-reduce:transition-none",
        size === "compact" ? "text-[11px]" : "text-[12px]",
        className,
      )}
      {...props}
    />
  );
});

type NavigationMenuSubContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
};

const NavigationMenuSubContext =
  React.createContext<NavigationMenuSubContextValue | null>(null);

function useNavigationMenuSubContext(): NavigationMenuSubContextValue {
  const ctx = React.useContext(NavigationMenuSubContext);
  if (!ctx) {
    throw new Error(
      "NavigationMenuSub components must be used within <NavigationMenuSub>",
    );
  }
  return ctx;
}

export function NavigationMenuSub({ children }: NavigationMenuSubProps) {
  const [open, setOpen] = React.useState(false);
  const reactId = React.useId();
  const ctx = React.useMemo<NavigationMenuSubContextValue>(
    () => ({ open, setOpen, contentId: `nav-sub-${reactId}` }),
    [open, reactId],
  );

  return (
    <NavigationMenuSubContext.Provider value={ctx}>
      <div className="relative">{children}</div>
    </NavigationMenuSubContext.Provider>
  );
}
NavigationMenuSub.displayName = "NavigationMenuSub";

export const NavigationMenuSubTrigger = React.forwardRef<
  HTMLButtonElement,
  NavigationMenuSubTriggerProps
>(function NavigationMenuSubTrigger(
  { className, children, onClick, ...props },
  ref,
) {
  const { open, setOpen, contentId } = useNavigationMenuSubContext();
  const prefersReducedMotion = useReducedMotion();
  return (
    <button
      ref={ref}
      type="button"
      data-slot="navigation-menu-sub-trigger"
      data-state={open ? "open" : "closed"}
      aria-expanded={open}
      aria-controls={contentId}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(!open);
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-[var(--primitive-radius-item,0.625rem)] px-2.5 py-2 text-sm outline-none",
        "transition-colors duration-100 ease-out motion-reduce:transition-none",
        "text-[var(--foreground)]",
        "hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))]",
        "data-popup-open:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))] data-open:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))]",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))]",
        "active:scale-[0.97] motion-reduce:active:scale-100",
        className,
      )}
      {...props}
    >
      {children}
      <span className="ml-auto flex items-center">
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 90 : 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.18, ease: EASE_OUT }
          }
          className="flex items-center justify-center text-[var(--muted-foreground)]"
        >
          <IconChevronRight size={14} stroke={2} />
        </motion.span>
      </span>
    </button>
  );
});

export const NavigationMenuSubContent = React.forwardRef<
  HTMLDivElement,
  NavigationMenuSubContentProps
>(function NavigationMenuSubContent(
  { className, children, ...props },
  ref,
) {
  const { open, contentId } = useNavigationMenuSubContext();
  const prefersReducedMotion = useReducedMotion();

  // Destructure HTML-only event handlers that conflict with Framer Motion's
  // drag types to prevent TS2322 when spreading onto motion.div.
  const {
    onDrag: _onDrag,
    onDragStart: _onDragStart,
    onDragEnd: _onDragEnd,
    onAnimationStart: _onAnimationStart,
    ...safeProps
  } = props;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          ref={ref}
          id={contentId}
          role="menu"
          data-slot="navigation-menu-sub-content"
          data-state="open"
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 0, height: 0 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, height: "auto" }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, height: 0 }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.18, ease: EASE_OUT }
          }
          className={cn("overflow-hidden pl-4", className)}
          {...safeProps}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
 });

export const NavigationMenuGroup = React.forwardRef<
  HTMLDivElement,
  NavigationMenuGroupProps
>(function NavigationMenuGroup({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="group"
      data-slot="navigation-menu-group"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
});

export const NavigationMenuGroupHeading = React.forwardRef<
  HTMLHeadingElement,
  NavigationMenuGroupHeadingProps
>(function NavigationMenuGroupHeading({ className, children, ...props }, ref) {
  return (
    <h4
      ref={ref}
      data-slot="navigation-menu-group-heading"
      className={cn(
        "px-2.5 py-1.5 text-[11px] font-medium tracking-[0.02em] text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  );
});

