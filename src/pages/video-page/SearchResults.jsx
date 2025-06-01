// src/pages/video-page/SearchResults.jsx

import React from "react";
import { Link } from "react-router";

// Move getRelativeTime out so it isn’t recreated on every render
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

/**
 * Props:
 *  - videos: array of video objects; defaults to [] if undefined
 *  - channelIcons: { [channelId]: thumbnailURL }; defaults to {} if undefined
 *  - hoveredVideoId, setHoveredVideoId: for hover‐preview behavior
 *  - loading: boolean indicating fetch in progress; defaults to false
 *
 * This component simply displays up to 50 videos from the passed‐in array.
 * It does not fetch or load more on scroll—API is called once by the parent.
 */
export default function SearchResults({
  videos = [],
  channelIcons = {},
  hoveredVideoId,
  setHoveredVideoId,
  loading = false,
}) {
  const safeVideos = Array.isArray(videos) ? videos : [];

  if (loading) {
    return <p className="text-center mt-8 text-gray-400">Loading results…</p>;
  }

  if (safeVideos.length === 0) {
    return <p className="text-center mt-8 text-gray-400">No results found.</p>;
  }

  // Only show the first 50 results
  const displayVideos = safeVideos.slice(0, 50);

  return (
    <div className="space-y-6">
      {displayVideos.map((video) => {
        const vidId = video.id;
        const { snippet, statistics } = video;
        const publishedRelative = getRelativeTime(snippet.publishedAt);
        const viewCount = statistics?.viewCount
          ? Number(statistics.viewCount).toLocaleString()
          : "0";

        const channelIconUrl =
          channelIcons[snippet.channelId] ||
          "https://www.youtube.com/s/desktop/placeholder.png";

        return (
          <Link
            to={`/watch/${vidId}`}
            key={vidId}
            className="flex gap-4 items-start hover:bg-gray-800 p-3 rounded-md transition"
          >
            {/* Thumbnail */}
            <div
              className="relative w-40 h-24 bg-black rounded-lg overflow-hidden"
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
                  src={snippet.thumbnails.medium.url}
                  alt={snippet.title}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex gap-3">
              <img
                src={channelIconUrl}
                alt={snippet.channelTitle}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <h2 className="text-sm font-medium leading-tight line-clamp-2 text-white">
                  {snippet.title}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {snippet.channelTitle}
                </p>
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
