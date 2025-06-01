// src/components/VideoGrid.jsx

import React from "react";
import { Link } from "react-router";

/**
 * Props:
 *  - videos: array of video objects from YouTube API (each contains .id, .snippet, .statistics)
 *  - channelIcons: { [channelId]: thumbnailURL }
 *  - hoveredVideoId, setHoveredVideoId: for hover‐preview iframe
 */
export default function VideoGrid({
  videos,
  channelIcons,
  hoveredVideoId,
  setHoveredVideoId,
}) {
  // Helper: format published time relative
  const getRelativeTime = (isoString) => {
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
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {videos.map((video, index) => {
        const vidId = video.id;
        const { snippet, statistics } = video;
        const publishedRelative = getRelativeTime(snippet.publishedAt);
        const viewCount = statistics?.viewCount
          ? Number(statistics.viewCount).toLocaleString()
          : "0";

        // Channel icon (fallback if not yet loaded)
        const channelIconUrl =
          channelIcons[snippet.channelId] ||
          "https://www.youtube.com/s/desktop/placeholder.png";

        return (
          <Link
            to={`/watch/${vidId}`}
            key={`${vidId}-${index}`}
            className="group"
          >
            <div
              className="relative pb-[56.25%] bg-black overflow-hidden rounded-lg"
              onMouseEnter={() => setHoveredVideoId(vidId)}
              onMouseLeave={() => setHoveredVideoId(null)}
            >
              {hoveredVideoId === vidId ? (
                <iframe
                  style={{ pointerEvents: "none" }}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  src={`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&loop=1&playlist=${vidId}`}
                  allow="autoplay"
                  title="preview"
                />
              ) : (
                <img
                  src={snippet.thumbnails.high.url}
                  alt={snippet.title}
                  className="absolute top-0 left-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
              )}
            </div>
            <div className="mt-2 flex">
              <img
                src={channelIconUrl}
                alt={snippet.channelTitle}
                className="w-10 h-10 rounded-full"
              />
              <div className="ml-3 flex-1">
                <h2 className="text-sm font-medium leading-tight line-clamp-2">
                  {snippet.title}
                </h2>
                <p className="text-xs text-gray-400">{snippet.channelTitle}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {viewCount} views • {publishedRelative}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
