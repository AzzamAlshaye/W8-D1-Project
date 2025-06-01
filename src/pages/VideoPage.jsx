// src/pages/VideoPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import axios from "axios";

const API_KEY = "AIzaSyBchUlb9-p61sooK84Qvl5wWS4CnaE62Es";
const COMMENTS_API = "https://683c222328a0b0f2fdc64548.mockapi.io/comments";

export default function VideoPage() {
  const { videoId } = useParams();
  const [videoDetails, setVideoDetails] = useState(null);
  const [channelImage, setChannelImage] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Loading flags
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  const isLoading = loadingVideo || loadingRelated || loadingComments;
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    // Reset state whenever videoId changes
    setVideoDetails(null);
    setChannelImage(null);
    setRelatedVideos([]);
    setComments([]);
    setNewComment("");
    setLoadingVideo(true);
    setLoadingRelated(true);
    setLoadingComments(true);

    // 1) Fetch main video details (snippet + statistics)
    fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          setVideoDetails(video);

          // Fetch channel thumbnail
          const channelId = video.snippet.channelId;
          return fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`
          );
        } else {
          console.warn("No video items found for videoId =", videoId);
          setLoadingVideo(false);
          return Promise.reject("No video found");
        }
      })
      .then((chRes) => chRes.json())
      .then((chData) => {
        if (
          chData.items &&
          chData.items.length > 0 &&
          chData.items[0].snippet.thumbnails
        ) {
          const thumbs = chData.items[0].snippet.thumbnails;
          const url =
            (thumbs.medium && thumbs.medium.url) || thumbs.default.url;
          setChannelImage(url);
        }
      })
      .catch((err) => {
        if (err !== "No video found") {
          console.error("Error during video + channel fetch:", err);
        }
      })
      .finally(() => {
        setLoadingVideo(false);
      });

    // 2) Fetch related videos
    fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=10&key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const mapped = data.items
            .map((item) => {
              const vid = item.id.videoId;
              return vid
                ? {
                    id: vid,
                    snippet: item.snippet,
                  }
                : null;
            })
            .filter(Boolean);
          setRelatedVideos(mapped);
        } else {
          console.warn("No related videos found for videoId =", videoId);
          setRelatedVideos([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching related videos:", err);
        setRelatedVideos([]);
      })
      .finally(() => {
        setLoadingRelated(false);
      });

    // 3) Fetch comments from MockAPI, filtered by videoId
    axios
      .get(COMMENTS_API, { params: { videoId } })
      .then((resp) => {
        // Ensure each comment has numeric counts and arrays
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
        console.error("Error fetching comments:", err);
        setComments([]);
      })
      .finally(() => {
        setLoadingComments(false);
      });
  }, [videoId]);

  // Handler to post a new comment
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

  // Handler for liking a comment (toggle on/off, enforce single reaction)
  const handleCommentLike = async (index) => {
    if (!isAuth) {
      console.warn("User not authenticated. Cannot like comment.");
      return;
    }
    const comment = comments[index];
    if (!comment || !comment.id) {
      console.warn("Cannot like: missing comment or comment.id", comment);
      return;
    }

    const userId = currentUserId;
    const hasLiked = comment.likedBy.includes(userId);
    const hasDisliked = comment.dislikedBy.includes(userId);

    let newLikedBy = [...comment.likedBy];
    let newDislikedBy = [...comment.dislikedBy];
    let newLikeCount = comment.likeCount;
    let newDislikeCount = comment.dislikeCount;

    if (hasLiked) {
      // User already liked → remove their like
      newLikedBy = newLikedBy.filter((u) => u !== userId);
      newLikeCount -= 1;
    } else {
      // Add like
      newLikedBy.push(userId);
      newLikeCount += 1;

      // If previously disliked, remove dislike
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

  // Handler for disliking a comment (toggle on/off, enforce single reaction)
  const handleCommentDislike = async (index) => {
    if (!isAuth) {
      console.warn("User not authenticated. Cannot dislike comment.");
      return;
    }
    const comment = comments[index];
    if (!comment || !comment.id) {
      console.warn("Cannot dislike: missing comment or comment.id", comment);
      return;
    }

    const userId = currentUserId;
    const hasLiked = comment.likedBy.includes(userId);
    const hasDisliked = comment.dislikedBy.includes(userId);

    let newLikedBy = [...comment.likedBy];
    let newDislikedBy = [...comment.dislikedBy];
    let newLikeCount = comment.likeCount;
    let newDislikeCount = comment.dislikeCount;

    if (hasDisliked) {
      // User already disliked → remove their dislike
      newDislikedBy = newDislikedBy.filter((u) => u !== userId);
      newDislikeCount -= 1;
    } else {
      // Add dislike
      newDislikedBy.push(userId);
      newDislikeCount += 1;

      // If previously liked, remove like
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

  // Show loader if any request is still pending
  if (isLoading || !videoDetails) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading video…</p>
      </div>
    );
  }

  const { snippet, statistics } = videoDetails;
  const videoLikeCount = statistics.likeCount || "0";
  const videoDislikeCount = statistics.dislikeCount || "0";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-gray-800 p-4">
        <Link to="/" className="text-white hover:underline">
          ← Back to Home
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row p-4 gap-6">
        {/* Left Column: Player, Info, Comments */}
        <div className="w-full lg:w-3/4">
          {/* Video IFrame */}
          <div className="w-full aspect-w-16 aspect-h-9 bg-black">
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

          {/* Channel Info + Publish Date */}
          <div className="mt-2 flex items-center gap-3">
            {channelImage ? (
              <img
                src={channelImage}
                alt={snippet.channelTitle + " thumbnail"}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
            )}
            <div>
              <p className="text-sm font-medium">{snippet.channelTitle}</p>
              <p className="text-gray-400 text-xs">
                {new Date(snippet.publishedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Like/Dislike on the Video (informational) */}
          <div className="mt-4 flex items-center gap-6">
            <button className="flex items-center gap-1 text-gray-300 hover:text-white">
              <span className="text-lg">👍</span>
              <span className="text-sm">{videoLikeCount}</span>
            </button>
            <button className="flex items-center gap-1 text-gray-300 hover:text-white">
              <span className="text-lg">👎</span>
              <span className="text-sm">{videoDislikeCount}</span>
            </button>
          </div>

          {/* Comments Section */}
          <section className="mt-8">
            <h2 className="text-lg font-medium">Comments</h2>

            {isAuth ? (
              <form onSubmit={handleAddComment} className="mt-4 flex flex-col">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Add a public comment..."
                  className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-md p-2 focus:outline-none focus:border-gray-500"
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

            <div className="mt-6 space-y-4">
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
                          👍 <span>{c.likeCount}</span>
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
                          👎 <span>{c.dislikeCount}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Related Videos */}
        <aside className="w-full lg:w-1/4 space-y-4">
          <h2 className="text-lg font-medium">Related Videos</h2>
          <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
            {relatedVideos.length === 0 ? (
              <p className="text-gray-500">No related videos found.</p>
            ) : (
              relatedVideos.map((vid) => {
                const thumb =
                  (vid.snippet.thumbnails.medium &&
                    vid.snippet.thumbnails.medium.url) ||
                  vid.snippet.thumbnails.default.url;

                return (
                  <Link
                    to={`/watch/${vid.id}`}
                    key={vid.id}
                    className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md"
                  >
                    <div className="w-32 flex-shrink-0">
                      <img
                        src={thumb}
                        alt={vid.snippet.title}
                        className="w-full h-auto rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium line-clamp-2">
                        {vid.snippet.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {vid.snippet.channelTitle}
                      </p>
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
