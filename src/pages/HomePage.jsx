// src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";

const API_KEY = "AIzaSyBchUlb9-p61sooK84Qvl5wWS4CnaE62Es";

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [channelIcons, setChannelIcons] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);

  // mode: 'popular' or 'search'; searchQuery holds the current (submitted) query
  const [mode, setMode] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredVideoId, setHoveredVideoId] = useState(null);
  const suggestionsRef = useRef(null);

  // Calculate relative time (e.g., “10 hours ago”) from an ISO string
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

  // Fetch videos; if isLoadMore, append; else replace.
  // After fetching videos, we immediately collect channelIds and fetch their thumbnails.
  const fetchVideos = useCallback(
    async (isLoadMore = false) => {
      setLoading(true);

      try {
        let fetchedItems = [];
        let newNextPage = null;

        if (mode === "popular") {
          // 1) Fetch “Most Popular” videos
          const url = new URL("https://www.googleapis.com/youtube/v3/videos");
          url.searchParams.set("part", "snippet,statistics");
          url.searchParams.set("chart", "mostPopular");
          url.searchParams.set("maxResults", "20");
          url.searchParams.set("regionCode", "US");
          url.searchParams.set("key", API_KEY);
          if (isLoadMore && nextPageToken) {
            url.searchParams.set("pageToken", nextPageToken);
          }

          const resp = await fetch(url.toString());
          const data = await resp.json();
          fetchedItems = data.items || [];
          newNextPage = data.nextPageToken || null;
        } else {
          // 2) SEARCH mode: first call search endpoint
          const searchUrl = new URL(
            "https://www.googleapis.com/youtube/v3/search"
          );
          searchUrl.searchParams.set("part", "snippet");
          searchUrl.searchParams.set("maxResults", "20");
          searchUrl.searchParams.set("type", "video");
          searchUrl.searchParams.set("q", searchQuery);
          searchUrl.searchParams.set("key", API_KEY);
          if (isLoadMore && nextPageToken) {
            searchUrl.searchParams.set("pageToken", nextPageToken);
          }

          const searchResp = await fetch(searchUrl.toString());
          const searchData = await searchResp.json();
          const searchItems = searchData.items || [];
          newNextPage = searchData.nextPageToken || null;

          // 3) Extract IDs, then call videos endpoint for details
          const ids = searchItems
            .map((item) => item.id.videoId)
            .filter(Boolean);
          if (ids.length > 0) {
            const detailsUrl = new URL(
              "https://www.googleapis.com/youtube/v3/videos"
            );
            detailsUrl.searchParams.set("part", "snippet,statistics");
            detailsUrl.searchParams.set("id", ids.join(","));
            detailsUrl.searchParams.set("key", API_KEY);

            const detailsResp = await fetch(detailsUrl.toString());
            const detailsData = await detailsResp.json();
            fetchedItems = detailsData.items || [];
          } else {
            fetchedItems = [];
          }
        }

        // 4) Update `videos` state (append or replace)
        if (isLoadMore) {
          setVideos((prev) => [...prev, ...fetchedItems]);
        } else {
          setVideos(fetchedItems);
        }
        setNextPageToken(newNextPage);

        // 5) AFTER we have all fetchedItems, gather their channelIds
        //    and make a Channels API call to get each channel's thumbnail
        const uniqueChannelIds = [
          ...new Set(fetchedItems.map((vid) => vid.snippet.channelId)),
        ].filter(Boolean);

        if (uniqueChannelIds.length > 0) {
          // Build the URL for channels.list
          const channelsUrl = new URL(
            "https://www.googleapis.com/youtube/v3/channels"
          );
          channelsUrl.searchParams.set("part", "snippet");
          channelsUrl.searchParams.set("id", uniqueChannelIds.join(","));
          channelsUrl.searchParams.set("key", API_KEY);

          const channelsResp = await fetch(channelsUrl.toString());
          const channelsData = await channelsResp.json();
          const channelsItems = channelsData.items || [];

          // Build a mapping: channelId → thumbnailURL
          const newIcons = {};
          channelsItems.forEach((channel) => {
            const cid = channel.id;
            const thumbUrl = channel.snippet.thumbnails?.default?.url || "";
            if (cid && thumbUrl) {
              newIcons[cid] = thumbUrl;
            }
          });

          // Merge with any existing icons (so “load more” keeps older entries)
          setChannelIcons((prev) => ({ ...prev, ...newIcons }));
        }
      } catch (err) {
        console.error("Error fetching videos or channels:", err);
      } finally {
        setLoading(false);
      }
    },
    [mode, nextPageToken, searchQuery]
  );

  // On mount or when mode/searchQuery changes, reset pagination and fetch first batch
  useEffect(() => {
    setNextPageToken(null);
    fetchVideos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searchQuery]);

  // Infinite scroll: load more when near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !nextPageToken) return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.offsetHeight - 300
      ) {
        fetchVideos(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, nextPageToken, fetchVideos]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    setMode("search");
    setSearchQuery(term);
    setSuggestions([]);
  };

  // Fetch “Search Suggestions” whenever searchTerm changes
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
            searchTerm
          )}`,
          { signal }
        );
        const data = await response.json();
        // data[1] is an array of suggestion strings
        setSuggestions(Array.isArray(data[1]) ? data[1] : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Suggestion fetch error:", err);
        }
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset to “popular” home
  const goHome = () => {
    setMode("popular");
    setSearchTerm("");
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header / Search Bar */}
      <header className="sticky top-0 z-10 bg-gray-800 p-4 flex items-center space-x-4">
        <h1 className="text-2xl font-semibold">YouTube Clone</h1>

        {mode === "search" && (
          <button
            onClick={goHome}
            className="text-gray-300 hover:text-white bg-gray-700 px-3 py-1 rounded"
          >
            Home
          </button>
        )}

        <form
          onSubmit={handleSearch}
          className="flex flex-1 max-w-lg items-center relative"
        >
          <div className="relative w-full" ref={suggestionsRef}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full rounded-l-md px-3 py-2 bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white text-black mt-1 rounded shadow-lg z-20 max-h-60 overflow-y-auto">
                {suggestions.map((sugg) => (
                  <li
                    key={sugg}
                    className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setSearchTerm(sugg);
                      setMode("search");
                      setSearchQuery(sugg);
                      setSuggestions([]);
                    }}
                  >
                    {sugg}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-r-md"
          >
            Search
          </button>
        </form>
      </header>

      {/* Video Grid */}
      <main className="p-4">
        {videos.length === 0 && loading ? (
          <p className="text-center mt-8">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => {
              const vidId = video.id;
              const { snippet, statistics } = video;
              const publishedRelative = getRelativeTime(snippet.publishedAt);
              const viewCount = statistics?.viewCount
                ? Number(statistics.viewCount).toLocaleString()
                : "0";

              // Get the channel icon from our state (fallback to a  placeholder if not yet loaded)
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
                      <img
                        src={snippet.thumbnails.high.url}
                        alt={snippet.title}
                        className="absolute top-0 left-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    )}
                  </div>
                  <div className="mt-2 flex">
                    {/* Use the fetched channel icon here */}
                    <img
                      src={channelIconUrl}
                      alt={snippet.channelTitle}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="ml-3 flex-1">
                      <h2 className="text-sm font-medium leading-tight line-clamp-2">
                        {snippet.title}
                      </h2>
                      <p className="text-xs text-gray-400">
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
        )}

        {/* Loading indicator at bottom when fetching more */}
        {loading && videos.length > 0 && (
          <p className="text-center mt-6">Loading more videos…</p>
        )}
      </main>
    </div>
  );
}
