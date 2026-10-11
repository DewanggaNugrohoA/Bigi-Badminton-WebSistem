import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SlideTabItem {
    id: string;
    label: string;
    href?: string;
    onClick?: () => void;
    active?: boolean;
}

export interface SlideTabsProps {
    items: SlideTabItem[];
    activeId?: string;
    onSelect?: (id: string) => void;
    className?: string;
}

export function SlideTabs({ items, activeId, onSelect, className }: SlideTabsProps) {
    const defaultIndex = items.findIndex((item) => (activeId ? item.id === activeId : item.active));
    const [selected, setSelected] = useState(defaultIndex >= 0 ? defaultIndex : 0);
    const [position, setPosition] = useState({
        left: 0,
        width: 0,
        opacity: 0,
    });

    const tabsRef = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const found = items.findIndex((item) => (activeId ? item.id === activeId : item.active));
        if (found >= 0) {
            setSelected(found);
        }
    }, [activeId, items]);

    useEffect(() => {
        const selectedTab = tabsRef.current[selected];
        if (selectedTab) {
            setPosition({
                left: selectedTab.offsetLeft,
                width: selectedTab.offsetWidth,
                opacity: 1,
            });
        }
    }, [selected, items]);

    const handleResetToSelected = () => {
        const selectedTab = tabsRef.current[selected];
        if (selectedTab) {
            setPosition({
                left: selectedTab.offsetLeft,
                width: selectedTab.offsetWidth,
                opacity: 1,
            });
        }
    };

    return (
        <ul
            onMouseLeave={handleResetToSelected}
            className={cn(
                "relative flex w-fit items-center rounded-full border border-border/80 bg-background/80 p-1 backdrop-blur-md shadow-xs",
                className
            )}
        >
            {items.map((item, i) => (
                <SlideTab
                    key={item.id}
                    ref={(el) => {
                        tabsRef.current[i] = el;
                    }}
                    setPosition={setPosition}
                    onClick={() => {
                        setSelected(i);
                        item.onClick?.();
                        onSelect?.(item.id);
                    }}
                    isSelected={selected === i}
                >
                    {item.label}
                </SlideTab>
            ))}

            <SlideCursor position={position} />
        </ul>
    );
}

interface SlideTabProps {
    children: React.ReactNode;
    setPosition: (pos: { left: number; width: number; opacity: number }) => void;
    onClick: () => void;
    isSelected: boolean;
}

const SlideTab = React.forwardRef<HTMLLIElement, SlideTabProps>(
    ({ children, setPosition, onClick, isSelected }, ref) => {
        return (
            <li
                ref={ref}
                onClick={onClick}
                onMouseEnter={(e) => {
                    const target = e.currentTarget;
                    setPosition({
                        left: target.offsetLeft,
                        width: target.offsetWidth,
                        opacity: 1,
                    });
                }}
                className={cn(
                    "relative z-10 block cursor-pointer select-none rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors duration-200 md:px-4 md:py-2 md:text-sm",
                    isSelected
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                {children}
            </li>
        );
    }
);

SlideTab.displayName = "SlideTab";

function SlideCursor({
    position,
}: {
    position: { left: number; width: number; opacity: number };
}) {
    return (
        <motion.li
            animate={{
                left: position.left,
                width: position.width,
                opacity: position.opacity,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="absolute z-0 h-[calc(100%-8px)] rounded-full bg-[var(--brand)] shadow-xs pointer-events-none"
        />
    );
}
