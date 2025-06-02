// src/components/VideoGrid.jsx

import React from "react";
import { Link } from "react-router";

// Import your utilities
import getRelativeTime from "../../utils/RelativeTime";
import formatDuration from "../../utils/formatDuration";

/**
 * Props:
 *  - videos: array of video objects (each { id: string, snippet, statistics, contentDetails })
 *  - channelIcons: { [channelId]: thumbnailURL }
 *  - hoveredVideoId, setHoveredVideoId: for hover‐preview behavior
 */
export default function VideoGrid({
  videos,
  channelIcons,
  hoveredVideoId,
  setHoveredVideoId,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-10">
      {videos.map((video) => {
        const vidId = video.id; // e.g. "dQw4w9WgXcQ"
        const { snippet, statistics, contentDetails } = video;

        // Use your RelativeTime utility:
        const publishedRelative = getRelativeTime(snippet.publishedAt);

        const viewCount = statistics?.viewCount
          ? Number(statistics.viewCount).toLocaleString()
          : "0";

        // Format the ISO 8601 duration using your formatDuration utility:
        const durationISO = contentDetails?.duration || "";
        const formattedDuration = formatDuration(durationISO);

        // Fallback channel icon if not yet fetched:
        const channelIconUrl =
          channelIcons[snippet.channelId] ||
          "https://www.youtube.com/s/desktop/placeholder.png";

        return (
          <Link to={`/watch/${vidId}`} key={vidId} className="group">
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
                <>
                  <img
                    src={snippet.thumbnails.high.url}
                    alt={snippet.title}
                    className="absolute top-0 left-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  {/* Duration overlay in bottom-right */}
                  {formattedDuration && (
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {formattedDuration}
                    </span>
                  )}
                </>
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
                <p className="text-xs font-semibold text-gray-400">
                  {snippet.channelTitle}
                </p>
                <p className="text-xs font-semibold text-gray-500 mt-1">
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
