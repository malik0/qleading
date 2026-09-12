/**
 * Audio codec and device environment capability utilities.
 * Specifically handles Smart TV browsers (Samsung Tizen, LG webOS, Android TV, Fire TV, etc.)
 * which lack WebM/Opus hardware decoding support and require universal MP3 streams.
 */

/**
 * Detects if the current user agent belongs to a Smart TV or set-top box browser.
 */
export function isTVBrowser(): boolean {
  if (typeof window === "undefined" || !navigator?.userAgent) return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("smart-tv") ||
    ua.includes("smarttv") ||
    ua.includes("tizen") ||
    ua.includes("webos") ||
    ua.includes("web0s") ||
    ua.includes("netcast") ||
    ua.includes("viera") ||
    ua.includes("bravia") ||
    ua.includes("hisense") ||
    ua.includes("vidaa") ||
    ua.includes("aftb") || // Fire TV box
    ua.includes("aftt") || // Fire TV stick
    ua.includes("aftm") || // Fire TV stick
    ua.includes("hbbtv") ||
    ua.includes("appletv") ||
    ua.includes("crkey") || // Chromecast
    ua.includes("roku") ||
    (ua.includes("android") && (ua.includes("tv") || ua.includes("large screen"))) ||
    ua.includes("googletv") ||
    ua.includes("playstation") ||
    ua.includes("xbox")
  );
}

/**
 * Checks whether the current browser can decode WebM container with Opus audio codec.
 * TV browsers, Safari on iOS/macOS, and older browsers return "" (empty string = not supported).
 */
export function canPlayWebmOpus(): boolean {
  if (typeof window === "undefined" || typeof Audio === "undefined") return false;
  try {
    const audio = document.createElement("audio");
    if (!audio.canPlayType) return false;
    const canPlay = audio.canPlayType('audio/webm; codecs="opus"').replace(/^no$/, "");
    return canPlay === "probably" || canPlay === "maybe";
  } catch {
    return false;
  }
}

/**
 * Determines the most reliable audio format for the current environment.
 * On TV browsers and platforms without WebM Opus support, always returns 'mp3'
 * to leverage universal hardware decoders and prevent playback failures.
 */
export function getBestAudioFormat(preferLocalAudio?: boolean): "webm" | "mp3" {
  if (typeof window === "undefined") return "mp3";

  // TV browsers always require MP3 for hardware decoder reliability
  if (isTVBrowser()) {
    return "mp3";
  }

  // If WebM Opus is not supported, fallback to MP3 immediately
  if (!canPlayWebmOpus()) {
    return "mp3";
  }

  // If user requested local WebM and it is supported
  if (preferLocalAudio) {
    return "webm";
  }

  return "mp3";
}

