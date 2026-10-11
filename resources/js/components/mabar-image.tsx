import { useState } from "react";
import { cn } from "@/lib/utils";

interface MabarImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    aspectRatio?: string;
    variant?: "banner" | "avatar";
}

export function MabarImage({
    src,
    alt,
    className = "",
    aspectRatio = "aspect-[16/9]",
    variant = "banner",
}: MabarImageProps) {
    const [hasError, setHasError] = useState(false);

    const imageUrl = src
        ? src.startsWith("http") || src.startsWith("/")
            ? src
            : `/storage/${src}`
        : null;

    if (variant === "avatar") {
        if (!imageUrl || hasError) {
            return (
                <div
                    className={cn(
                        "size-14 rounded-full bg-muted border border-border/70 flex items-center justify-center text-muted-foreground font-bold text-xs uppercase select-none shrink-0 shadow-xs",
                        className
                    )}
                >
                    <span>{alt.substring(0, 2)}</span>
                </div>
            );
        }

        return (
            <div
                className={cn(
                    "size-14 rounded-full overflow-hidden bg-background border border-border/80 shrink-0 shadow-xs flex items-center justify-center p-0.5",
                    className
                )}
            >
                <img
                    src={imageUrl}
                    alt={alt}
                    onError={() => setHasError(true)}
                    className="size-full object-cover object-center rounded-full"
                    loading="lazy"
                />
            </div>
        );
    }

    if (!imageUrl || hasError) {
        return (
            <div
                className={cn(
                    "w-full bg-muted/50 border-b border-border/50 flex items-center justify-center text-muted-foreground p-4 text-center select-none overflow-hidden",
                    aspectRatio,
                    className
                )}
            >
                <span className="text-xs font-medium text-muted-foreground/80 tracking-wide">Bigi Badminton</span>
            </div>
        );
    }

    return (
        <div className={cn("overflow-hidden bg-muted/20", aspectRatio, className)}>
            <img
                src={imageUrl}
                alt={alt}
                onError={() => setHasError(true)}
                className="w-full h-full object-cover object-center"
                loading="lazy"
            />
        </div>
    );
}
