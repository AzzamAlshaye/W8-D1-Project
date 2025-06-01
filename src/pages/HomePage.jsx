// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";

const API_KEY = "AIzaSyBchUlb9-p61sooK84Qvl5wWS4CnaE62Es";

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);

  // mode: 'popular' or 'search'; searchQuery holds the current query
  const [mode, setMode] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch videos: if isLoadMore, append; else replace.
  const fetchVideos = useCallback(
    async (isLoadMore = false) => {
      setLoading(true);
      try {
        if (mode === "popular") {
          // Fetch most popular with snippet & statistics
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
          const items = data.items || [];

          if (isLoadMore) {
            setVideos((prev) => [...prev, ...items]);
          } else {
            setVideos(items);
          }
          setNextPageToken(data.nextPageToken || null);
        } else {
          // SEARCH mode: 1) call search endpoint
          let searchUrl = new URL(
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
          const newNextPage = searchData.nextPageToken || null;

          // 2) Extract IDs and call videos endpoint for details
          const ids = searchItems
            .map((item) => item.id.videoId)
            .filter(Boolean);
          if (ids.length) {
            const detailsUrl = new URL(
              "https://www.googleapis.com/youtube/v3/videos"
            );
            detailsUrl.searchParams.set("part", "snippet,statistics");
            detailsUrl.searchParams.set("id", ids.join(","));
            detailsUrl.searchParams.set("key", API_KEY);

            const detailsResp = await fetch(detailsUrl.toString());
            const detailsData = await detailsResp.json();
            const detailItems = detailsData.items || [];

            if (isLoadMore) {
              setVideos((prev) => [...prev, ...detailItems]);
            } else {
              setVideos(detailItems);
            }
            setNextPageToken(newNextPage);
          } else {
            // No matching IDs; reset if not loadMore
            if (!isLoadMore) setVideos([]);
            setNextPageToken(newNextPage);
          }
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
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
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header / Search Bar */}
      <header className="sticky top-0 z-10 bg-gray-800 p-4 flex items-center">
        <h1 className="text-2xl font-semibold mr-6">YouTube Clone</h1>
        <form
          onSubmit={handleSearch}
          className="flex flex-1 max-w-lg items-center"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full rounded-l-md px-3 py-2 bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          />
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

              return (
                <Link to={`/watch/${vidId}`} key={vidId} className="group">
                  <div className="relative pb-[56.25%] bg-black overflow-hidden rounded-lg">
                    <img
                      src={snippet.thumbnails.high.url}
                      alt={snippet.title}
                      className="absolute top-0 left-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="mt-2 flex">
                    <img
                      src={snippet.thumbnails.default.url}
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
