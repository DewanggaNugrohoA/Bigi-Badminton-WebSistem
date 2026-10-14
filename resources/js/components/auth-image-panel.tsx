import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface AuthImagePanelProps {
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
    backHref?: string;
    backLabel?: string;
}

export function AuthImagePanel({
    imageSrc,
    imageAlt,
    title,
    description,
    backHref = '/',
    backLabel = 'Kembali ke beranda',
}: AuthImagePanelProps) {
    return (
        <aside
            aria-label="Panel Ilustrasi Bigi Badminton"
            className="hidden lg:flex flex-1 sticky top-0 h-dvh max-h-dvh relative flex-col overflow-hidden bg-gradient-to-br from-white via-violet-50 to-violet-100 border-r border-violet-100/80 select-none"
        >
            
            <div className="absolute top-6 left-6 z-20">
                <Link
                    href={backHref}
                    aria-label={backLabel}
                    className="w-11 h-11 bg-white/80 hover:bg-white active:scale-95 backdrop-blur-md border border-slate-200/80 rounded-full flex items-center justify-center transition-all text-slate-700 hover:text-slate-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>

            
            <div className="relative flex-1 min-h-0 w-full flex items-center justify-center px-6 pt-16 pb-2">
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    width={735}
                    height={970}
                    className="h-4/5 max-h-[85%] w-auto max-w-[90%] object-contain object-center mix-blend-multiply select-none pointer-events-none"
                />
            </div>

            
            <div className="relative shrink-0 w-full px-8 pb-8 pt-2">
                <div className="max-w-md">
                    <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                        {title}
                    </h2>
                    <p className="text-slate-600 text-xs xl:text-sm leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </aside>
    );
}

interface AuthMobileBannerProps {
    imageSrc?: string;
    imageAlt?: string;
    isCompact?: boolean;
    backHref?: string;
    backLabel?: string;
}

export function AuthMobileBanner({
    imageSrc = '/images/panel-athletes-transparent.png',
    imageAlt = 'Ilustrasi Atlet Bigi Badminton',
    isCompact = false,
    backHref = '/',
    backLabel = 'Kembali ke beranda',
}: AuthMobileBannerProps) {
    return (
        <div className="lg:hidden w-full flex flex-col items-center shrink-0 select-none mb-1 sm:mb-2">
            
            <div className="w-full flex items-center justify-start pb-1">
                <Link
                    href={backHref}
                    aria-label={backLabel}
                    className="w-11 h-11 bg-secondary/80 hover:bg-secondary active:scale-95 backdrop-blur-md border border-border/60 rounded-full flex items-center justify-center transition-all text-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>

            
            <div className={`auth-mobile-illustration w-full flex items-center justify-center py-1 sm:py-2 ${
                isCompact
                    ? 'max-h-[clamp(75px,13dvh,120px)]'
                    : 'max-h-[clamp(110px,20dvh,180px)]'
            }`}>
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    width={735}
                    height={970}
                    className={`w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-all ${
                        isCompact
                            ? 'h-[clamp(75px,13dvh,120px)]'
                            : 'h-[clamp(110px,20dvh,180px)]'
                    }`}
                />
            </div>
        </div>
    );
}

export default AuthImagePanel;
