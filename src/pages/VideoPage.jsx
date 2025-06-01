import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";

const API_KEY = "AIzaSyBchUlb9-p61sooK84Qvl5wWS4CnaE62Es";

export default function VideoPage() {
  const { videoId } = useParams();
  const [videoDetails, setVideoDetails] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Load video details & related videos on mount or when videoId changes
  useEffect(() => {
    setLoading(true);

    // 1) Fetch video snippet & statistics (for title, channel, etc.)
    fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setVideoDetails(data.items[0]);
        }
      })
      .catch((err) => console.error("Error fetching video details:", err));

    // 2) Fetch related videos
    fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=10&key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data.items || []).map((item) => ({
          id: item.id.videoId,
          snippet: item.snippet,
        }));
        setRelatedVideos(mapped);
      })
      .catch((err) => console.error("Error fetching related videos:", err))
      .finally(() => setLoading(false));

    // 3) Load stored comments for this video from localStorage
    const stored = localStorage.getItem(`comments_${videoId}`);
    if (stored) {
      try {
        setComments(JSON.parse(stored));
      } catch {
        setComments([]);
      }
    } else {
      setComments([]);
    }
  }, [videoId]);

  // Handler to post a new comment
  const handleAddComment = (e) => {
    e.preventDefault();
    const isAuth = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuth) return;

    if (newComment.trim() === "") return;

    const updated = [
      ...comments,
      {
        text: newComment.trim(),
        postedAt: new Date().toISOString(),
        author: localStorage.getItem("fullName") || "Anonymous",
      },
    ];
    setComments(updated);
    localStorage.setItem(`comments_${videoId}`, JSON.stringify(updated));
    setNewComment("");
  };

  if (loading || !videoDetails) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading video…</p>
      </div>
    );
  }

  const { snippet } = videoDetails;
  const isAuth = localStorage.getItem("isAuthenticated") === "true";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-gray-800 p-4">
        <Link to="/" className="text-white hover:underline">
          ← Back to Home
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row p-4 gap-6">
        {/* Left: Video player + title + comments */}
        <div className="w-full lg:w-3/4">
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

          <h1 className="mt-4 text-xl font-semibold">{snippet.title}</h1>
          <p className="text-gray-400 text-sm">
            {snippet.channelTitle} ·{" "}
            {new Date(snippet.publishedAt).toLocaleDateString()}
          </p>

          {/* Comments Section */}
          <section className="mt-8">
            <h2 className="text-lg font-medium">Comments</h2>

            {/* Add Comment Form */}
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
                Please <span className="font-semibold">log in</span> to post a
                comment.
              </p>
            )}

            {/* Display Comments */}
            <div className="mt-6 space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500">No comments yet.</p>
              ) : (
                comments.map((c, idx) => (
                  <div key={idx} className="border-b border-gray-700 pb-4">
                    <p className="text-sm font-medium">{c.author}</p>
                    <p className="text-gray-300 text-sm">{c.text}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(c.postedAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right: Related Videos */}
        <aside className="w-full lg:w-1/4 space-y-4">
          <h2 className="text-lg font-medium">Related Videos</h2>
          <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
            {relatedVideos.map((vid) => (
              <Link
                to={`/watch/${vid.id}`}
                key={vid.id}
                className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md"
              >
                <div className="w-32 flex-shrink-0">
                  <img
                    src={vid.snippet.thumbnails.medium.url}
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
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
