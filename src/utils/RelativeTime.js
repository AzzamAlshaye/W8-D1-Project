// src/utils/RelativeTime.js
export function getRelativeTime(isoString) {
  const published = new Date(isoString).getTime();
  const now = Date.now();
  const diffSeconds = Math.floor((now - published) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  }
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
}
