// src/utils/formatDuration.js
export default function formatDuration(isoDuration) {
  // Matches e.g. "PT1H2M30S", "PT5M4S", "PT45S"
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  if (hours > 0) {
    const m = minutes < 10 ? `0${minutes}` : minutes;
    const s = seconds < 10 ? `0${seconds}` : seconds;
    return `${hours}:${m}:${s}`;
  }

  const m = minutes;
  const s = seconds < 10 ? `0${seconds}` : seconds;
  return `${m}:${s}`;
}
