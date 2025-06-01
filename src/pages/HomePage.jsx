// src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import VideoGrid from "./video-page/VideoGrid";
import SearchResults from "./video-page/SearchResults";

const API_KEY = "AIzaSyBchUlb9-p61sooK84Qvl5wWS4CnaE62Es";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const suggestionsRef = useRef(null);

  // 1) Parse “search_query” from URL on mount / location change
  const urlParams = new URLSearchParams(location.search);
  const initialQuery = urlParams.get("search_query") || "";

  // 2) State hooks
  const [videos, setVideos] = useState([]);
  const [channelIcons, setChannelIcons] = useState({});
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);

  // mode: “popular” or “search”
  // If there is a non‐empty initialQuery, start in search mode
  const [mode, setMode] = useState(initialQuery ? "search" : "popular");
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const [hoveredVideoId, setHoveredVideoId] = useState(null);

  // Helper to compute relative time (“X hours ago”)
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

  // 3) Fetch videos (either popular or search) + fetch channel icons
  const fetchVideos = useCallback(
    async (isLoadMore = false) => {
      setLoading(true);

      try {
        let fetchedItems = [];
        let newNextPage = null;

        if (mode === "popular") {
          // ──────────────── Most Popular ────────────────
          const url = new URL("https://www.googleapis.com/youtube/v3/videos");
          url.searchParams.set("part", "snippet,statistics");
          url.searchParams.set("chart", "mostPopular");
          url.searchParams.set("maxResults", "20");
          url.searchParams.set("regionCode", "SA");
          url.searchParams.set("key", API_KEY);
          if (isLoadMore && nextPageToken) {
            url.searchParams.set("pageToken", nextPageToken);
          }

          const resp = await fetch(url.toString());
          const data = await resp.json();
          fetchedItems = data.items || [];
          newNextPage = data.nextPageToken || null;
        } else {
          // ──────────────── Search Mode ────────────────
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

        // 4) Update videos state
        if (isLoadMore) {
          setVideos((prev) => [...prev, ...fetchedItems]);
        } else {
          setVideos(fetchedItems);
        }
        setNextPageToken(newNextPage);

        // 5) Fetch channel icons for those videos
        const uniqueChannelIds = [
          ...new Set(fetchedItems.map((vid) => vid.snippet.channelId)),
        ].filter(Boolean);

        if (uniqueChannelIds.length > 0) {
          const channelsUrl = new URL(
            "https://www.googleapis.com/youtube/v3/channels"
          );
          channelsUrl.searchParams.set("part", "snippet");
          channelsUrl.searchParams.set("id", uniqueChannelIds.join(","));
          channelsUrl.searchParams.set("key", API_KEY);

          const channelsResp = await fetch(channelsUrl.toString());
          const channelsData = await channelsResp.json();
          const channelsItems = channelsData.items || [];

          const newIcons = {};
          channelsItems.forEach((channel) => {
            const cid = channel.id;
            const thumbUrl = channel.snippet.thumbnails?.default?.url || "";
            if (cid && thumbUrl) {
              newIcons[cid] = thumbUrl;
            }
          });

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

  // 6) On mount — or whenever mode/searchQuery changes — fetch first page
  useEffect(() => {
    setNextPageToken(null);
    fetchVideos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searchQuery]);

  // 7) Sync mode & searchTerm whenever the URL’s “search_query” param changes
  //    (this catches the browser Back/Forward buttons)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search_query") || "";

    if (q.trim() !== "") {
      setMode("search");
      setSearchQuery(q);
      setSearchTerm(q);
    } else {
      setMode("popular");
      setSearchQuery("");
      setSearchTerm("");
    }
  }, [location.search]);

  // 8) Infinite scroll: load more when near bottom
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

  // 9) Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    // 9a) Update the URL so it becomes “/?search_query=…”
    navigate(`/?search_query=${encodeURIComponent(term)}`);

    // 9b) Optimistically set mode & searchQuery
    setMode("search");
    setSearchQuery(term);
    setSuggestions([]);
  };

  // 10) Fetch autocomplete suggestions (YouTube “type‐ahead”) whenever searchTerm changes
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

  // 11) Hide suggestions when clicking outside
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

  // 12) “Home” button: clear the query param, revert to popular
  const goHome = () => {
    navigate("/");
    setMode("popular");
    setSearchTerm("");
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ───────── Header / Search Bar ───────── */}
      <header className="sticky top-0 z-10 bg-gray-800 p-4 flex items-center space-x-4">
        <h1 className="text-2xl font-semibold">YouTube Clone</h1>

        {mode === "search" && searchQuery.trim() !== "" && (
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
                {suggestions.map((sugg, idx) => (
                  <li
                    key={`${sugg}-${idx}`}
                    className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setSearchTerm(sugg);
                      navigate(`/?search_query=${encodeURIComponent(sugg)}`);
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

      {/* ───────── Main Content ───────── */}
      <main className="p-4">
        {videos.length === 0 && loading ? (
          <p className="text-center mt-8">Loading...</p>
        ) : (
          <>
            {mode === "search" && searchQuery.trim() !== "" ? (
              <SearchResults
                videos={videos}
                channelIcons={channelIcons}
                hoveredVideoId={hoveredVideoId}
                setHoveredVideoId={setHoveredVideoId}
              />
            ) : (
              <VideoGrid
                videos={videos}
                channelIcons={channelIcons}
                hoveredVideoId={hoveredVideoId}
                setHoveredVideoId={setHoveredVideoId}
              />
            )}
          </>
        )}

        {loading && videos.length > 0 && (
          <p className="text-center mt-6">Loading more videos…</p>
        )}
      </main>
    </div>
  );
}
