// src/pages/LikedVideos.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import axios from "axios";
import Navbar from "../../components/Navbar";
import formatDuration from "../../utils/formatDuration";

const API_KEY = "AIzaSyBchUlb9-p61sooK84Qvl5wWS4CnaE62Es";
const LIKED_VIDEOS_API =
  "https://683e928b1cd60dca33dc32c0.mockapi.io/likedVideos";

export default function LikedVideos() {
  const navigate = useNavigate();
  const location = useLocation();

  // ────────────────────────────────────────────────────────────────────────────────────
  // ─── Navbar / Search State (same as in VideoPage) ───
  const urlParams = new URLSearchParams(location.search);
  const initialQuery = urlParams.get("search_query") || "";

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const suggestionsRef = useRef(null);
  const [mode] = useState(initialQuery ? "search" : "popular");

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    navigate(`/?search_query=${encodeURIComponent(term)}`);
    setSuggestions([]);
  };

  const handleSuggestionClick = (sugg) => {
    setSearchTerm(sugg);
    navigate(`/?search_query=${encodeURIComponent(sugg)}`);
    setSuggestions([]);
  };

  const goHome = () => {
    navigate("/");
    setSearchTerm("");
    setSuggestions([]);
  };

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
        if (!response.ok) {
          setSuggestions([]);
          return;
        }
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
  // ────────────────────────────────────────────────────────────────────────────────────

  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  const currentUserId = localStorage.getItem("userId");

  const [likedEntries, setLikedEntries] = useState([]); // { id, userId, videoId }
  const [likedVideoDetails, setLikedVideoDetails] = useState([]); // YouTube API video objects
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
      return;
    }

    axios
      .get(LIKED_VIDEOS_API, { params: { userId: currentUserId } })
      .then((resp) => {
        const entries = Array.isArray(resp.data) ? resp.data : [];
        setLikedEntries(entries);

        if (entries.length === 0) {
          setLikedVideoDetails([]);
          setIsLoading(false);
          return;
        }

        const allVideoIds = entries.map((e) => e.videoId).join(",");

        return axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${allVideoIds}&key=${API_KEY}`
        );
      })
      .then((youtubeResp) => {
        if (
          youtubeResp &&
          youtubeResp.data &&
          Array.isArray(youtubeResp.data.items)
        ) {
          setLikedVideoDetails(youtubeResp.data.items);
        }
      })
      .catch((err) => {
        console.error("Error fetching liked videos:", err);
        setLikedVideoDetails([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuth, currentUserId, navigate]);

  if (!isAuth) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <p>Loading your liked videos…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      {/* ───────── Navbar ───────── */}
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

      {/* ───────── Main Content ───────── */}
      <div className="flex flex-col p-4">
        <h1 className="text-2xl font-semibold mb-6">Your Liked Videos</h1>

        {likedVideoDetails.length === 0 ? (
          <p className="text-gray-400">
            You haven’t liked any videos yet. Go to{" "}
            <span
              className="text-blue-400 underline cursor-pointer"
              onClick={() => navigate("/")}
            >
              Home
            </span>{" "}
            and start liking!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedVideoDetails.map((video) => {
              const { id, snippet, statistics, contentDetails } = video;
              const thumbSrc =
                (snippet.thumbnails.high && snippet.thumbnails.high.url) ||
                snippet.thumbnails.default.url;
              const title = snippet.title;
              const channelTitle = snippet.channelTitle;
              const publishedAt = snippet.publishedAt;
              const viewCount = Number(
                statistics.viewCount || 0
              ).toLocaleString();

              let totalSeconds = 0;
              const match = contentDetails.duration.match(
                /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
              );
              if (match) {
                const hours = parseInt(match[1] || "0", 10);
                const minutes = parseInt(match[2] || "0", 10);
                const seconds = parseInt(match[3] || "0", 10);
                totalSeconds = hours * 3600 + minutes * 60 + seconds;
              }
              const hoursPart = Math.floor(totalSeconds / 3600);
              const minutesPart = Math.floor((totalSeconds % 3600) / 60)
                .toString()
                .padStart(1, "0");
              const secondsPart = (totalSeconds % 60)
                .toString()
                .padStart(2, "0");
              const durationFormatted = hoursPart
                ? `${hoursPart}:${minutesPart}:${secondsPart}`
                : `${minutesPart}:${secondsPart}`;

              return (
                <Link
                  to={`/watch/${id}`}
                  key={id}
                  className="bg-neutral-800 rounded-lg overflow-hidden hover:bg-neutral-700 transition-all"
                >
                  <div className="relative">
                    <img
                      src={thumbSrc}
                      alt={title}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-xs text-white px-1 rounded">
                      {durationFormatted}
                    </div>
                  </div>
                  <div className="p-3">
                    <h2 className="text-sm font-medium line-clamp-2">
                      {title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">{channelTitle}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>{viewCount} views</span>
                      <span className="mx-1">•</span>
                      <span>
                        {new Date(publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
