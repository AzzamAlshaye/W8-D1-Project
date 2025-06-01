// src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import Navbar from "../components/Navbar"; // ← import the new Navbar
import VideoGrid from "./video-page/VideoGrid";
import SearchResults from "./video-page/SearchResults";

const API_KEY = "AIzaSyBBro6atDbmlP2ypqbIEIdmDTzmFEb3vFQ";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const suggestionsRef = useRef(null);

  // 1) Parse “search_query” from URL on mount / location change
  const urlParams = new URLSearchParams(location.search);
  const initialQuery = urlParams.get("search_query") || "";

  // 2) State hooks
  const [videos, setVideos] = useState([]); // holds fetched video objects
  const [channelIcons, setChannelIcons] = useState({}); // { channelId: thumbnailUrl, … }
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);

  // mode: “popular” or “search”
  const [mode, setMode] = useState(initialQuery ? "search" : "popular");
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const [hoveredVideoId, setHoveredVideoId] = useState(null);

  // 3) In-memory cache for video details per ID
  const videoDetailsCache = useRef({}); // { videoId: videoObject, … }

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

  // 4) Fetch videos (most popular or search) + fetch channel icons
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
          console.log("YouTube searchData:", searchData);
          const searchItems = searchData.items || [];
          newNextPage = searchData.nextPageToken || null;

          // Extract video IDs and only fetch details for IDs not already in cache
          const idsToFetch = [];
          const detailsFromCache = [];

          searchItems.forEach((item) => {
            const vidId = item.id.videoId;
            if (vidId) {
              if (videoDetailsCache.current[vidId]) {
                // use cached details
                detailsFromCache.push(videoDetailsCache.current[vidId]);
              } else {
                idsToFetch.push(vidId);
              }
            }
          });

          let detailsFetched = [];
          if (idsToFetch.length > 0) {
            const detailsUrl = new URL(
              "https://www.googleapis.com/youtube/v3/videos"
            );
            detailsUrl.searchParams.set("part", "snippet,statistics");
            detailsUrl.searchParams.set("id", idsToFetch.join(","));
            detailsUrl.searchParams.set("key", API_KEY);

            const detailsResp = await fetch(detailsUrl.toString());
            const detailsData = await detailsResp.json();
            detailsFetched = detailsData.items || [];

            // Cache each fetched video’s details
            detailsFetched.forEach((vid) => {
              videoDetailsCache.current[vid.id] = vid;
            });
          }

          // Combine cached + newly fetched details
          fetchedItems = [...detailsFromCache, ...detailsFetched];
        }

        // 5) Update videos state
        if (isLoadMore) {
          setVideos((prev) => [...prev, ...fetchedItems]);
        } else {
          setVideos(fetchedItems);
        }
        setNextPageToken(newNextPage);

        // 6) Fetch channel icons for those videos—only for channelIds not already in channelIcons
        const uniqueChannelIds = [
          ...new Set(fetchedItems.map((vid) => vid.snippet.channelId)),
        ].filter((cid) => cid && !channelIcons[cid]);

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

          // Build a map of new icons
          const newIcons = {};
          channelsItems.forEach((channel) => {
            const cid = channel.id;
            const thumbUrl = channel.snippet.thumbnails?.default?.url || "";
            if (cid && thumbUrl) {
              newIcons[cid] = thumbUrl;
            }
          });

          // Merge into state
          setChannelIcons((prev) => ({ ...prev, ...newIcons }));
        }
      } catch (err) {
        console.error("Error fetching videos or channels:", err);
      } finally {
        setLoading(false);
      }
    },
    [mode, nextPageToken, searchQuery, channelIcons]
  );

  // 7) On mount — or whenever mode/searchQuery changes — fetch first page
  useEffect(() => {
    setNextPageToken(null);
    fetchVideos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searchQuery]);

  // 8) Sync mode & searchTerm whenever the URL’s “search_query” param changes
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

  // 9) Infinite scroll: load more when near bottom
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

  // 10) Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    // Update the URL so it becomes “/?search_query=…”
    navigate(`/?search_query=${encodeURIComponent(term)}`);

    // Optimistically set mode & searchQuery (HomePage's effects will sync everything)
    setMode("search");
    setSearchQuery(term);
    setSuggestions([]);
  };

  // 11) Fetch autocomplete suggestions (YouTube “type-ahead”) whenever searchTerm changes
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

    // Debounce 200ms
    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm]);

  // 12) Hide suggestions when clicking outside
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

  // 13) “Home” button: clear the query param, revert to popular
  const goHome = () => {
    navigate("/");
    setMode("popular");
    setSearchTerm("");
    setSearchQuery("");
    setSuggestions([]);
  };

  // 14) When a suggestion is clicked:
  const handleSuggestionClick = (sugg) => {
    setSearchTerm(sugg);
    navigate(`/?search_query=${encodeURIComponent(sugg)}`);
    setMode("search");
    setSearchQuery(sugg);
    setSuggestions([]);
  };

  // HomePage.jsx
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ─── Navbar #1 ─── */}
      <Navbar
        mode={mode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        suggestions={suggestions}
        suggestionsRef={suggestionsRef}
        onSuggestionClick={handleSuggestionClick}
        onSearchSubmit={handleSearch}
        onHomeClick={goHome}
      />

      <main className="p-4">
        {mode === "search" ? (
          <SearchResults />
        ) : (
          /* VideoGrid also renders its own Navbar as #2 */
          <VideoGrid
            videos={videos}
            channelIcons={channelIcons}
            hoveredVideoId={hoveredVideoId}
            setHoveredVideoId={setHoveredVideoId}
            /* Passing down the exact same Navbar props into VideoGrid */
            mode={mode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            suggestions={suggestions}
            suggestionsRef={suggestionsRef}
            onSuggestionClick={handleSuggestionClick}
            onSearchSubmit={handleSearch}
            onHomeClick={goHome}
          />
        )}

        {loading && videos.length > 0 && (
          <p className="text-center mt-6">Loading more videos…</p>
        )}
      </main>
    </div>
  );
}
