import type { AyahMarker } from "../types/quran";
import { JUZ_MARKERS } from "../data/juzMarkers";

/**
 * Returns the active AyahMarker for a given Juz and playback position in seconds
 */
export function getAyahMarkerForPosition(
  juzId: number,
  positionSeconds: number
): AyahMarker | null {
  const markers = JUZ_MARKERS[juzId];
  if (!markers || markers.length === 0) return null;
  const pos = Math.max(0, positionSeconds);
  const idx = markers.findIndex(
    (m) => pos >= m.startTime && pos < m.endTime
  );
  if (idx !== -1) return markers[idx];
  if (pos >= markers[markers.length - 1].startTime) {
    return markers[markers.length - 1];
  }
  return markers[0];
}
