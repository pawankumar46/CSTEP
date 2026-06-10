import { NextResponse } from "next/server";

const DEFAULT_FILE_ID = "1GwhnrClhI3WF-SO-lYmIZ8l3-YETBBP-";

const FILE_ID_PATTERNS = [
  /data-id="([a-zA-Z0-9_-]+)"/,
  /\/file\/d\/([a-zA-Z0-9_-]+)/,
  /_DRIVE_ivd[^[]*\[\["([a-zA-Z0-9_-]+)"/,
  /"([a-zA-Z0-9_-]{25,})","?\["1X4KOmgyZHDS7ZbW70pIN7bwcYKbKvc8a"\]/,
];

function extractFileId(html: string): string | null {
  for (const pattern of FILE_ID_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");

  if (!folderId) {
    return NextResponse.json({ error: "folderId is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ fileId: DEFAULT_FILE_ID });
    }

    const html = await response.text();
    const fileId = extractFileId(html) ?? DEFAULT_FILE_ID;

    return NextResponse.json({ fileId });
  } catch {
    return NextResponse.json({ fileId: DEFAULT_FILE_ID });
  }
}
