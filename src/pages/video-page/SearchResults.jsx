// src/pages/video-page/SearchResults.jsx

import React from "react";
import { Link } from "react-router";

// Import your utilities
import getRelativeTime from "../../utils/RelativeTime";
import formatDuration from "../../utils/formatDuration";

/**
 * Props:
 *  - videos: array of video objects; defaults to [] if undefined
 *  - channelIcons: { [channelId]: thumbnailURL }; defaults to {} if undefined
 *  - hoveredVideoId, setHoveredVideoId: for hover‐preview behavior
 *  - loading: boolean indicating fetch in progress; defaults to false
 *
 * This component simply displays up to 50 videos from the passed‐in array.
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
    <div className="flex flex-col items-center justify-center px-2">
      <div className="space-y-6 w-full">
        {displayVideos.map((video) => {
          const vidId = video.id;
          const { snippet, statistics, contentDetails } = video;

          // Use your RelativeTime utility:
          const publishedRelative = getRelativeTime(snippet.publishedAt);

          const viewCount = statistics?.viewCount
            ? Number(statistics.viewCount).toLocaleString()
            : "0";

          // Format the ISO 8601 duration:
          const durationISO = contentDetails?.duration || "";
          const formattedDuration = formatDuration(durationISO);

          const channelIconUrl =
            channelIcons[snippet.channelId] ||
            "https://www.youtube.com/s/desktop/placeholder.png";

          return (
            <div
              key={vidId}
              className="flex flex-col justify-center break-all items-center"
            >
              <Link
                to={`/watch/${vidId}`}
                className="
                  flex
                  gap-2 sm:gap-4
                  items-start
                  w-full sm:w-3/4
                  hover:bg-gray-800
                  p-2 sm:p-8
                  rounded-md
                  transition
                "
              >
                {/* Thumbnail */}
                <div
                  className="
                    relative
                    w-32 sm:w-80
                    h-20 sm:h-48
                    bg-black
                    rounded-lg
                    overflow-hidden
                    flex-shrink-0
                  "
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
                        src={snippet.thumbnails.medium.url}
                        alt={snippet.title}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                      {/* Duration badge */}
                      {formattedDuration && (
                        <span
                          className="
                          absolute bottom-1 right-1
                          bg-black bg-opacity-75
                          text-white text-xs
                          px-1 rounded
                        "
                        >
                          {formattedDuration}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Video info */}
                <div className="flex-1 flex gap-2">
                  <img
                    src={channelIconUrl}
                    alt={snippet.channelTitle}
                    className="w-5 h-5 lg:w-10 lg:h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h2
                      className="
                      text-sm lg:text-base
                       font-medium leading-tight
                       text-white
                    "
                    >
                      {snippet.title}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      {snippet.channelTitle}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      {viewCount} views • {publishedRelative}
                    </p>

                    {/* ─── Simple Video Description ─── */}
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 line-clamp-1 w-1/2 lg:line-clamp-2 lg:w-full  ">
                      {snippet.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
