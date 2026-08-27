const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CORE_BASE_URL =
  `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

let loadedFfmpeg:
  | import("@ffmpeg/ffmpeg").FFmpeg
  | null = null;

async function getFfmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (loadedFfmpeg) return loadedFfmpeg;

  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`,
      "text/javascript",
    ),
    wasmURL: await toBlobURL(
      `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
      "application/wasm",
    ),
  });
  loadedFfmpeg = ffmpeg;
  return ffmpeg;
}

export async function compressMp4(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  const [{ fetchFile }, ffmpeg] = await Promise.all([
    import("@ffmpeg/util"),
    getFfmpeg(),
  ]);
  const inputName = `input-${Date.now()}.mp4`;
  const outputName = `compressed-${Date.now()}.mp4`;

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(100, Math.max(0, Math.round(progress * 100))));
  };
  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      "scale='min(1280,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      outputName,
    ]);
    const output = await ffmpeg.readFile(outputName);
    const bytes =
      typeof output === "string"
        ? new TextEncoder().encode(output)
        : new Uint8Array(output);
    return new File(
      [bytes],
      file.name.replace(/\.mp4$/i, "-compressed.mp4"),
      { type: "video/mp4" },
    );
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
  }
}
