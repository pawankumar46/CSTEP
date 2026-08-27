"use client";

import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

const MESSAGE = "Please use headphones for audio experience.";

interface StreamingHeadphonesNoticeProps {
  className?: string;
}

function NoticeContent() {
  return (
    <span className="inline-flex items-center gap-2 px-6">
      <Headphones className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>{MESSAGE}</span>
    </span>
  );
}

export function StreamingHeadphonesNotice({ className }: StreamingHeadphonesNoticeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden border-b bg-primary/5 text-sm font-medium text-foreground",
        className,
      )}
      aria-label={MESSAGE}
    >
      <div className="flex h-9 items-center motion-reduce:justify-center">
        <div className="streaming-marquee-track flex shrink-0 items-center whitespace-nowrap motion-reduce:hidden">
          <NoticeContent />
          <span aria-hidden>
            <NoticeContent />
          </span>
        </div>
        <div className="hidden shrink-0 items-center motion-reduce:flex">
          <NoticeContent />
        </div>
      </div>
    </div>
  );
}
