"use client";

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConferenceDocument } from "@/lib/conference-documents";

interface ConferenceDocumentDialogProps {
  document: ConferenceDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConferenceDocumentDialog({
  document,
  open,
  onOpenChange,
}: ConferenceDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] w-[min(96vw,56rem)] flex-col gap-0 p-0 sm:max-w-none">
        <DialogHeader className="space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            {document?.title ?? "Document"}
          </DialogTitle>
          {document?.description && (
            <DialogDescription>{document.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="relative min-h-[50vh] flex-1 bg-muted/30 p-3 sm:p-4">
          {document && open ? (
            <iframe
              src={`${document.href}#toolbar=1&navpanes=0`}
              title={document.title}
              className="h-[min(58vh,560px)] w-full rounded-md border bg-background"
            />
          ) : null}
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:justify-between">
          {document ? (
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <a href={document.href} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </Button>
          ) : (
            <span />
          )}
          <DialogClose asChild>
            <Button type="button" size="sm">
              <X className="mr-2 h-4 w-4" aria-hidden />
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
