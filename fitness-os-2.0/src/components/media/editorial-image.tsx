"use client";
// Local encoded WebP variants use picture for separate mobile framing without duplicate preloads.
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
interface EditorialImageProps {
  src: string; alt: string; width: number; height: number; smallSrc?: string; smallWidth?: number;
  mobileSrc?: string; mobileSmallSrc?: string; priority?: boolean; sizes?: string; className?: string; position?: string;
}
export function EditorialImage({ src, alt, width, height, smallSrc, smallWidth = 480, mobileSrc, mobileSmallSrc, priority = false, sizes = "(max-width: 767px) 90vw, (max-width: 1100px) 45vw, 30vw", className = "", position = "50% 12%" }: EditorialImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = imageRef.current;
    if (!image || failedSrc === src) return;
    const checkFailure = () => {
      if (image.complete && image.naturalWidth === 0) setFailedSrc(src);
    };
    // A failed SSR image may finish before React attaches its event handler.
    // Reconcile the existing browser state once hydration has completed.
    const frame = requestAnimationFrame(checkFailure);
    image.addEventListener("error", checkFailure);
    return () => { cancelAnimationFrame(frame); image.removeEventListener("error", checkFailure); };
  }, [src, failedSrc]);
  return <div className={`editorial-image ${className}`} data-image-src={src}>
    {failedSrc === src ? <div className="editorial-image-fallback" role="img" aria-label={`${alt}（图片暂不可用）`} data-image-fallback="true"><ImageOff size={24} strokeWidth={1.3} /><span>运动不止一种模样</span><small>图片暂不可用</small></div> : <picture>
      {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSmallSrc ? `${mobileSmallSrc} 390w, ${mobileSrc} 753w` : mobileSrc} sizes="100vw" />}
      <img ref={imageRef} src={src} srcSet={smallSrc ? `${smallSrc} ${smallWidth}w, ${src} ${width}w` : undefined} sizes={sizes} width={width} height={height} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={() => setFailedSrc(src)} style={{ objectPosition: position }} />
    </picture>}
  </div>;
}
