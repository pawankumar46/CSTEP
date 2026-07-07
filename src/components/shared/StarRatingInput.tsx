"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  size = "md",
  disabled = false,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const starSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() => !disabled && onChange(star)}
        >
          <Star
            className={cn(
              starSize,
              "transition-colors",
              (hovered || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground",
              disabled && "opacity-50",
            )}
          />
        </button>
      ))}
    </div>
  );
}
