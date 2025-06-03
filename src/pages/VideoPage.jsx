// src/pages/VideoPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router";
import axios from "axios";
import Navbar from "../components/Navbar";
import RelativeTime from "../utils/RelativeTime"; // Adjust import path as needed
import formatDuration from "../utils/formatDuration"; // Adjust import path as needed

// ─────── React Icons Imports ───────
import { MdThumbUp, MdThumbDown } from "react-icons/md";
import { BiSolidLike, BiSolidDislike } from "react-icons/bi";

import { FiMoreHorizontal } from "react-icons/fi";
import { FaShare } from "react-icons/fa";

const API_KEY = "AIzaSyBBro6atDbmlP2ypqbIEIdmDTzmFEb3vFQ";
const COMMENTS_API = "https://683c222328a0b0f2fdc64548.mockapi.io/comments";

export default function VideoPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const suggestionsRef = useRef(null);

  // ────────── Navbar / Search State ──────────
  const urlParams = new URLSearchParams(location.search);
  const initialQuery = urlParams.get("search_query") || "";

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
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

  // Fetch YouTube autocomplete suggestions
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
          console.warn("Suggestion fetch failed:", response.status);
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

  // Hide suggestions on outside click
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

  // ────────── Video / Popular / Comments State ──────────
  const [videoDetails, setVideoDetails] = useState(null);
  const [VideoThumbnail, setVideoThumbnail] = useState(null);
  const [channelSubs, setChannelSubs] = useState(null);
  const [popularVideos, setPopularVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [loadingVideo, setLoadingVideo] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  const isLoading = loadingVideo || loadingPopular || loadingComments;
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  const currentUserId = localStorage.getItem("userId");

  // New state for collapsible description
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    // Reset state on videoId change
    setVideoDetails(null);
    setVideoThumbnail(null);
    setChannelSubs(null);
    setPopularVideos([]);
    setComments([]);
    setNewComment("");
    setIsDescExpanded(false);
    setLoadingVideo(true);
    setLoadingPopular(true);
    setLoadingComments(true);

    // 1) Fetch main video details
    (async () => {
      try {
        const resp = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`
        );
        if (!resp.ok) {
          console.warn("YouTube video fetch failed:", resp.status);
          setLoadingVideo(false);
          return;
        }
        const data = await resp.json();
        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          setVideoDetails(video);

          // Fetch channel thumbnail AND subscriber count
          const channelId = video.snippet.channelId;
          const chResp = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`
          );
          if (!chResp.ok) {
            console.warn("YouTube channel fetch failed:", chResp.status);
          } else {
            const chData = await chResp.json();
            if (chData.items && chData.items.length > 0) {
              // 1) thumbnail
              const thumbs = chData.items[0].snippet.thumbnails;
              const url =
                (thumbs.medium && thumbs.medium.url) || thumbs.default.url;
              setVideoThumbnail(url);

              // 2) subscriber count
              const subs = chData.items[0].statistics.subscriberCount;
              setChannelSubs(Number(subs));
            }
          }
        } else {
          console.warn("No video items found for videoId =", videoId);
        }
      } catch (err) {
        console.error("Error during video + channel fetch:", err);
      } finally {
        setLoadingVideo(false);
      }
    })();

    // 2) Fetch most popular videos (with contentDetails for duration)
    (async () => {
      try {
        const resp = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&maxResults=10&regionCode=SA&key=${API_KEY}`
        );
        if (!resp.ok) {
          console.warn("YouTube popular fetch failed:", resp.status);
          setPopularVideos([]);
        } else {
          const data = await resp.json();
          if (data.items && data.items.length > 0) {
            const mapped = data.items.map((item) => ({
              id: item.id,
              snippet: item.snippet,
              duration: item.contentDetails.duration,
            }));
            setPopularVideos(mapped);
          } else {
            console.warn("No popular videos found.");
            setPopularVideos([]);
          }
        }
      } catch (err) {
        console.error("Error fetching popular videos:", err);
        setPopularVideos([]);
      } finally {
        setLoadingPopular(false);
      }
    })();

    // 3) Fetch comments from MockAPI, filtering by videoId
    axios
      .get(COMMENTS_API, { params: { videoId } })
      .then((resp) => {
        const normalized = resp.data.map((c) => ({
          ...c,
          likeCount: Number(c.likeCount) || 0,
          dislikeCount: Number(c.dislikeCount) || 0,
          likedBy: Array.isArray(c.likedBy) ? c.likedBy : [],
          dislikedBy: Array.isArray(c.dislikedBy) ? c.dislikedBy : [],
        }));
        setComments(normalized);
      })
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          // Treat 404 as “no comments yet”
          setComments([]);
        } else {
          console.error("Error fetching comments:", err);
          setComments([]);
        }
      })
      .finally(() => {
        setLoadingComments(false);
      });
  }, [videoId]);

  // ────────── Comment Handlers ──────────
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      console.warn("User not authenticated. Cannot post comment.");
      return;
    }
    if (newComment.trim() === "") {
      console.warn("Empty comment prevented.");
      return;
    }

    const commentPayload = {
      videoId,
      text: newComment.trim(),
      postedAt: new Date().toISOString(),
      author: localStorage.getItem("fullName") || "Anonymous",
      likeCount: 0,
      dislikeCount: 0,
      likedBy: [],
      dislikedBy: [],
    };

    try {
      const resp = await axios.post(COMMENTS_API, commentPayload);
      const added = {
        ...resp.data,
        likeCount: Number(resp.data.likeCount) || 0,
        dislikeCount: Number(resp.data.dislikeCount) || 0,
        likedBy: Array.isArray(resp.data.likedBy) ? resp.data.likedBy : [],
        dislikedBy: Array.isArray(resp.data.dislikedBy)
          ? resp.data.dislikedBy
          : [],
      };
      setComments((prev) => [...prev, added]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting new comment:", err);
    }
  };

  const handleCommentLike = async (index) => {
    if (!isAuth) {
      console.warn("User not authenticated. Cannot like comment.");
      return;
    }
    const comment = comments[index];
    if (!comment || !comment.id) return;

    const userId = currentUserId;
    const hasLiked = comment.likedBy.includes(userId);
    const hasDisliked = comment.dislikedBy.includes(userId);

    let newLikedBy = [...comment.likedBy];
    let newDislikedBy = [...comment.dislikedBy];
    let newLikeCount = comment.likeCount;
    let newDislikeCount = comment.dislikeCount;

    if (hasLiked) {
      newLikedBy = newLikedBy.filter((u) => u !== userId);
      newLikeCount -= 1;
    } else {
      newLikedBy.push(userId);
      newLikeCount += 1;
      if (hasDisliked) {
        newDislikedBy = newDislikedBy.filter((u) => u !== userId);
        newDislikeCount -= 1;
      }
    }

    try {
      const { data: updated } = await axios.patch(
        `${COMMENTS_API}/${comment.id}`,
        {
          likeCount: newLikeCount,
          dislikeCount: newDislikeCount,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy,
        }
      );
      setComments((prev) =>
        prev.map((c, i) =>
          i === index
            ? {
                ...c,
                likeCount: updated.likeCount,
                dislikeCount: updated.dislikeCount,
                likedBy: updated.likedBy,
                dislikedBy: updated.dislikedBy,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Error toggling likeCount:", err);
    }
  };

  const handleCommentDislike = async (index) => {
    if (!isAuth) {
      console.warn("User not authenticated. Cannot dislike comment.");
      return;
    }
    const comment = comments[index];
    if (!comment || !comment.id) return;

    const userId = currentUserId;
    const hasLiked = comment.likedBy.includes(userId);
    const hasDisliked = comment.dislikedBy.includes(userId);

    let newLikedBy = [...comment.likedBy];
    let newDislikedBy = [...comment.dislikedBy];
    let newLikeCount = comment.likeCount;
    let newDislikeCount = comment.dislikeCount;

    if (hasDisliked) {
      newDislikedBy = newDislikedBy.filter((u) => u !== userId);
      newDislikeCount -= 1;
    } else {
      newDislikedBy.push(userId);
      newDislikeCount += 1;
      if (hasLiked) {
        newLikedBy = newLikedBy.filter((u) => u !== userId);
        newLikeCount -= 1;
      }
    }

    try {
      const { data: updated } = await axios.patch(
        `${COMMENTS_API}/${comment.id}`,
        {
          likeCount: newLikeCount,
          dislikeCount: newDislikeCount,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy,
        }
      );
      setComments((prev) =>
        prev.map((c, i) =>
          i === index
            ? {
                ...c,
                likeCount: updated.likeCount,
                dislikeCount: updated.dislikeCount,
                likedBy: updated.likedBy,
                dislikedBy: updated.dislikedBy,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Error toggling dislikeCount:", err);
    }
  };

  // ────────── Render Loading State ──────────
  if (isLoading || !videoDetails) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <p>Loading video…</p>
      </div>
    );
  }

  // ────────── Extract Snippet & Statistics ──────────
  const { snippet, statistics } = videoDetails;
  const videoLikeCount = statistics.likeCount || "0";
  const videoDislikeCount = statistics.dislikeCount || "0";
  const viewCount = Number(statistics.viewCount || 0).toLocaleString();
  const publishedDate = new Date(snippet.publishedAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

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
      <div className="flex flex-col lg:flex-row p-4 lg:pl-10 gap-6">
        {/* Left Column: Player, Info, Description, Comments */}
        <div className="w-full lg:w-3/4 flex flex-col">
          {/* Video IFrame */}
          <div className="w-full bg-black h-64 md:h-96 lg:h-[600px]">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={snippet.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Title */}
          <h1 className="mt-4 text-xl font-semibold">{snippet.title}</h1>

          {/* Channel Info + Subscriber Count */}
          <div className="mt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex gap-3 items-center">
              {VideoThumbnail ? (
                <img
                  src={VideoThumbnail}
                  alt={snippet.channelTitle + " thumbnail"}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
              )}

              <div className="flex flex-col">
                <p className="text-sm font-medium">{snippet.channelTitle}</p>
                <p className="text-gray-400 text-xs">
                  {channelSubs !== null
                    ? `${channelSubs.toLocaleString()} subscribers`
                    : "Loading…"}
                </p>
              </div>
            </div>

            {/* Like/Dislike/Share/More */}
            <div className="mt-4 sm:mt-0 flex items-center gap-4">
              {/* Pill Container for Like/Dislike */}
              <div className="flex items-center bg-neutral-800 rounded-full overflow-hidden">
                <button
                  onClick={() => {}}
                  className="flex items-center gap-1 px-3 py-2 text-neutral-200 hover:bg-neutral-700"
                >
                  <BiSolidLike size={20} />
                  <span className="text-sm">{videoLikeCount}</span>
                </button>
                <div className="h-6 border-l border-neutral-700" />
                <button
                  onClick={() => {}}
                  className="flex items-center gap-1 px-3 py-2 text-neutral-200 hover:bg-neutral-700"
                >
                  <BiSolidDislike size={20} />
                </button>
              </div>

              {/* Share Button */}
              <button className="flex items-center gap-1 px-3 py-2 bg-neutral-800 rounded-full text-neutral-200 hover:bg-neutral-700">
                <FaShare size={18} />
                <span className="text-sm">Share</span>
              </button>

              {/* More Options Button */}
              <button className="flex items-center px-3 py-2 bg-neutral-800 rounded-full text-neutral-200 hover:bg-neutral-700">
                <FiMoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* ─── Combined Container for Views, Tags & Description ─── */}
          <div className="mt-2 bg-neutral-800 p-4 text-neutral-200 text-sm rounded-2xl">
            {/* 1) Views • Published Date */}
            <div className="flex items-center gap-2">
              <span>{`${viewCount} views`}</span>
              <span>•</span>
              <span>{publishedDate}</span>
            </div>

            {/* 2) (Optional) Render up to 5 tags as hashtags */}
            {snippet.tags && snippet.tags.length > 0 && (
              <div className="mt-1">
                {snippet.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="mr-2 text-neutral-400 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 3) Collapsible Description */}
            <div className="mt-2 text-gray-300 text-sm break-all">
              {!isDescExpanded ? (
                <>
                  <div className="relative max-h-12 overflow-hidden">
                    <div className="whitespace-pre-wrap">
                      {snippet.description}
                    </div>
                    {/* Fade‐out overlay */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-neutral-800 via-neutral-600/0" />
                  </div>
                  <button
                    onClick={() => setIsDescExpanded(true)}
                    className="mt-1 text-sm text-neutral-400 cursor-pointer focus:outline-none"
                  >
                    ...more
                  </button>
                </>
              ) : (
                <>
                  <div className="whitespace-pre-wrap text-neutral-100">
                    {snippet.description}
                  </div>
                  <button
                    onClick={() => setIsDescExpanded(false)}
                    className="mt-1 text-sm text-neutral-400 cursor-pointer focus:outline-none"
                  >
                    Show less
                  </button>
                </>
              )}
            </div>
          </div>
          {/* ─────────────────────────────────────────────────────────────────── */}

          {/* ────────── Comments Section ────────── */}
          <section className="mt-8 flex-1 flex flex-col">
            <h2 className="text-lg font-medium">Comments</h2>

            {isAuth ? (
              <form onSubmit={handleAddComment} className="mt-4 flex flex-col">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Add a public comment..."
                  className="w-full bg-neutral-800 text-white placeholder-gray-500 border border-neutral-950 rounded-md p-2 focus:outline-none focus:border-gray-500"
                ></textarea>
                <button
                  type="submit"
                  className="mt-2 self-end bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
                >
                  Comment
                </button>
              </form>
            ) : (
              <p className="mt-4 text-gray-500">
                Please <span className="font-semibold text-white">log in</span>{" "}
                to post a comment.
              </p>
            )}

            <div className="mt-6 space-y-4 overflow-auto">
              {comments.length === 0 ? (
                <p className="text-gray-500">No comments yet.</p>
              ) : (
                comments.map((c, idx) => {
                  const hasLiked = c.likedBy.includes(currentUserId);
                  const hasDisliked = c.dislikedBy.includes(currentUserId);

                  return (
                    <div
                      key={c.id}
                      className="flex flex-col border-b border-gray-700 pb-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{c.author}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(c.postedAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-gray-300 mt-1">{c.text}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleCommentLike(idx)}
                          aria-label={hasLiked ? "Remove like" : "Like comment"}
                          className={`flex items-center gap-1 text-sm ${
                            !isAuth
                              ? "text-gray-700 cursor-not-allowed"
                              : hasLiked
                              ? "text-blue-400"
                              : "text-gray-400 hover:text-white"
                          }`}
                          disabled={!isAuth}
                        >
                          <BiSolidLike size={20} /> <span>{c.likeCount}</span>
                        </button>
                        <button
                          onClick={() => handleCommentDislike(idx)}
                          aria-label={
                            hasDisliked ? "Remove dislike" : "Dislike comment"
                          }
                          className={`flex items-center gap-1 text-sm ${
                            !isAuth
                              ? "text-gray-700 cursor-not-allowed"
                              : hasDisliked
                              ? "text-red-400"
                              : "text-gray-400 hover:text-white"
                          }`}
                          disabled={!isAuth}
                        >
                          <BiSolidDislike size={20} />
                          <span>{c.dislikeCount}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Popular Videos (stacks under on small screens) */}
        <aside className="w-full lg:w-1/4 flex flex-col">
          <h2 className="text-lg font-medium mb-2">Popular Videos</h2>
          <div className="flex-1 flex flex-col space-y-3">
            {popularVideos.length === 0 ? (
              <p className="text-gray-500">No popular videos found.</p>
            ) : (
              popularVideos.map((vid) => {
                const thumb =
                  (vid.snippet.thumbnails.medium &&
                    vid.snippet.thumbnails.medium.url) ||
                  vid.snippet.thumbnails.default.url;
                const publishedAt = vid.snippet.publishedAt;
                const relative = RelativeTime(publishedAt); // e.g. "3 days ago"
                const durationFormatted = formatDuration(vid.duration); // e.g. "12:34"

                return (
                  <Link
                    to={`/watch/${vid.id}`}
                    key={vid.id}
                    className="flex items-start gap-3 hover:bg-gray-800 p-2 rounded-md"
                  >
                    <div className="w-32 flex-shrink-0 relative">
                      <img
                        src={thumb}
                        alt={vid.snippet.title}
                        className="w-full h-auto rounded-md"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-xs text-white px-1 rounded">
                        {durationFormatted}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-sm font-medium line-clamp-2">
                        {vid.snippet.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {vid.snippet.channelTitle}
                      </p>
                      <div className="text-xs text-gray-500">
                        <span>{relative}</span>
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
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
