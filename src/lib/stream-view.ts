export type StreamViewMode = "default" | "theater";

/** Player grows wider and taller in theater mode (YouTube-style). */
export const THEATER_PLAYER_CLASS =
  "relative w-full overflow-hidden aspect-video min-h-[12.5rem] sm:min-h-[clamp(15rem,38vw,34rem)] max-h-[min(72vh,34rem)]";
