// src/components/SearchResults.jsx

import React from "react";
import { Link } from "react-router";

/**
 * Props:
 *  - videos: array of video objects from YouTube API
 *  - channelIcons: { [channelId]: thumbnailURL }
 *  - hoveredVideoId, setHoveredVideoId: same hover logic
 */
export default function SearchResults({
  videos,
  channelIcons,
  hoveredVideoId,
  setHoveredVideoId,
}) {
  // Helper: relative timestamp
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
    <div className="flex flex-col gap-6">
      {videos.map((video, index) => {
        const vidId = video.id;
        const { snippet, statistics } = video;
        const publishedRelative = getRelativeTime(snippet.publishedAt);
        const viewCount = statistics?.viewCount
          ? Number(statistics.viewCount).toLocaleString()
          : "0";

        // Channel icon (fallback)
        const channelIconUrl =
          channelIcons[snippet.channelId] ||
          "https://www.youtube.com/s/desktop/placeholder.png";

        return (
          <Link
            to={`/watch/${vidId}`}
            key={`${vidId}-${index}`}
            className="flex space-x-4 hover:bg-gray-800 p-2 rounded-md transition"
          >
            {/* Left: medium thumbnail */}
            <div className="relative w-56 h-32 bg-black rounded-lg overflow-hidden flex-shrink-0">
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
                  src={snippet.thumbnails.medium.url}
                  alt={snippet.title}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
              )}
            </div>

            {/* Right: text details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold line-clamp-2">
                  {snippet.title}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {snippet.channelTitle}
                </p>
                <p className="text-sm text-gray-500">
                  {viewCount} views • {publishedRelative}
                </p>
                <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                  {snippet.description}
                </p>
              </div>
              <div className="flex items-center mt-2">
                <img
                  src={channelIconUrl}
                  alt={snippet.channelTitle}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <span className="text-xs text-gray-400">
                  {snippet.channelTitle}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
