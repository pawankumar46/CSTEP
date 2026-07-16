"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionScrollRowProps {
  children: ReactNode;
  className?: string;
  hint?: string;
}

export function SessionScrollRow({
  children,
  className,
  hint = "Use arrows or swipe · tap to select multiple",
}: SessionScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    setCanScrollLeft(element.scrollLeft > 1);
    setCanScrollRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    updateScrollState();

    element.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollBy = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;

    const amount = Math.max(352, element.clientWidth * 0.8);
    element.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto p-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => scrollBy("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll sessions left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">{hint}</p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => scrollBy("right")}
          disabled={!canScrollRight}
          aria-label="Scroll sessions right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
