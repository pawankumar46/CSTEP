"use client";

import { useCallback, useState } from "react";
import { CalendarDays, FileText } from "lucide-react";
import { ConferenceDocumentDialog } from "@/components/layout/ConferenceDocumentDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CONFERENCE_DOCUMENTS, type ConferenceDocument } from "@/lib/conference-documents";

const DOCUMENT_ICONS = {
  "concept-note": FileText,
  "event-agenda": CalendarDays,
} as const;

export function ConferenceDocumentsSection() {
  const [activeDocument, setActiveDocument] = useState<ConferenceDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDocument = useCallback((doc: ConferenceDocument) => {
    setActiveDocument(doc);
    setDialogOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setActiveDocument(null);
    }
  }, []);

  return (
    <>
      <div className="max-w-6xl mx-auto mb-10 space-y-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Concept Note &amp; Event Agenda</h3>
          <p className="text-sm text-muted-foreground">
            Official conference documents. View inline or open in a new tab.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CONFERENCE_DOCUMENTS.map((doc) => {
            const Icon = DOCUMENT_ICONS[doc.id as keyof typeof DOCUMENT_ICONS] ?? FileText;
            return (
              <Card key={doc.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button type="button" size="sm" onClick={() => openDocument(doc)}>
                    View document
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ConferenceDocumentDialog
        document={activeDocument}
        open={dialogOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
