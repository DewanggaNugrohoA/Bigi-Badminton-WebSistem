import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface MabarImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    aspectRatio?: string;
}

export function MabarImage({ src, alt, className = "", aspectRatio = "aspect-[16/9]" }: MabarImageProps) {
    const [hasError, setHasError] = useState(false);

    // Format storage URL jika src bukan absolute URL
    const imageUrl = src
        ? src.startsWith("http") || src.startsWith("/")
            ? src
            : `/storage/${src}`
        : null;

    if (!imageUrl || hasError) {
        return (
            <div
                className={cn(
                    "w-full bg-muted/40 border border-border/50 flex flex-col items-center justify-center text-muted-foreground p-4 text-center select-none overflow-hidden relative",
                    aspectRatio,
                    className
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                <ImageOff className="size-8 mb-2 opacity-40 relative z-10" />
                <span className="text-xs font-medium opacity-60 relative z-10">Bigi Badminton</span>
            </div>
        );
    }

    return (
        <div className={cn("overflow-hidden relative bg-muted/20", aspectRatio, className)}>
            <img
                src={imageUrl}
                alt={alt}
                onError={() => setHasError(true)}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
            />
        </div>
    );
}
