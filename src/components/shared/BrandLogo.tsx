import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_LOGO_DARK_SRC, BRAND_LOGO_SRC } from "@/lib/constants";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  height?: number;
  href?: string;
  priority?: boolean;
}

export function BrandLogo({
  className,
  imageClassName,
  height = 40,
  href = "/",
  priority = false,
}: BrandLogoProps) {
  const images = (
    <>
      <img
        src={BRAND_LOGO_SRC}
        alt="CSTEP"
        width={160}
        height={48}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className={cn("block dark:hidden h-auto w-auto object-contain", imageClassName)}
        style={{ maxHeight: height, width: "auto" }}
      />
      <img
        src={BRAND_LOGO_DARK_SRC}
        alt="CSTEP"
        width={213}
        height={80}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className={cn("hidden dark:block h-auto w-auto object-contain", imageClassName)}
        style={{ maxHeight: height, width: "auto" }}
      />
    </>
  );

  if (!href) {
    return <span className={cn("inline-flex items-center", className)}>{images}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center shrink-0", className)}>
      {images}
    </Link>
  );
}
