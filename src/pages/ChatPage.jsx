import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  FiSend,
  FiMoreVertical,
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiX,
  FiClock,
  FiBell,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Endpoints
const USERS_API = "https://683878942c55e01d184d6bf0.mockapi.io/auth";
const MESSAGES_API = "https://683878942c55e01d184d6bf0.mockapi.io/messages";

export default function ChatPage() {
  const navigate = useNavigate();
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  const userId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("fullName") || "";

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuth || !userId) {
      navigate("/login");
    }
  }, [isAuth, userId, navigate]);

  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allUsersOpen, setAllUsersOpen] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // 1. Initialize bgType from localStorage (fallback to "gray")
  const [bgType, setBgType] = useState(
    localStorage.getItem("bgType") || "gray"
  );
  const listRef = useRef(null);

  // Whenever bgType changes, persist it to localStorage
  useEffect(() => {
    localStorage.setItem("bgType", bgType);
  }, [bgType]);

  // Fetch users
  useEffect(() => {
    axios
      .get(USERS_API)
      .then((res) => {
        const others = res.data.filter((u) => u.id !== userId);
        setAllUsers(others);
        if (!selectedUser && others.length) {
          setSelectedUser(others[0]);
        }
      })
      .catch(console.error);
  }, [userId]);

  // Fetch messages periodically
  const fetchEntries = () => {
    axios
      .get(MESSAGES_API)
      .then((res) => setEntries(res.data))
      .catch(console.error);
  };
  useEffect(() => {
    fetchEntries();
    const id = setInterval(fetchEntries, 5000);
    return () => clearInterval(id);
  }, []);

  const requests = entries.filter((e) => e.type === "request");
  const chats = entries.filter(
    (e) => e.type === "chat" && e.status === "accepted"
  );

  const currentRequest = requests.find(
    (r) =>
      (r.fromId === userId && r.toId === selectedUser?.id) ||
      (r.fromId === selectedUser?.id && r.toId === userId)
  );
  const status = currentRequest?.status;

  const acceptedIds = requests
    .filter(
      (r) =>
        r.status === "accepted" && (r.fromId === userId || r.toId === userId)
    )
    .map((r) => (r.fromId === userId ? r.toId : r.fromId));

  const acceptedContacts = allUsers.filter((u) => acceptedIds.includes(u.id));
  const availableContacts = allUsers.filter((u) => !acceptedIds.includes(u.id));

  const convo = chats
    .filter(
      (m) =>
        (m.fromId === userId && m.toId === selectedUser?.id) ||
        (m.fromId === selectedUser?.id && m.toId === userId)
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Sidebar and chat actions
  const sendRequest = () => {
    if (!selectedUser) return;
    axios
      .post(MESSAGES_API, {
        fromId: userId,
        toId: selectedUser.id,
        type: "request",
        status: "pending",
        createdAt: new Date().toISOString(),
      })
      .then(() => {
        toast.success("Chat request sent");
        fetchEntries();
      });
  };

  const acceptRequest = () => {
    if (!currentRequest) return;
    axios
      .put(`${MESSAGES_API}/${currentRequest.id}`, {
        ...currentRequest,
        status: "accepted",
      })
      .then(() => {
        toast.success("Chat request accepted");
        fetchEntries();
      });
  };

  const cancelRequest = () => {
    if (!currentRequest) return;
    axios.delete(`${MESSAGES_API}/${currentRequest.id}`).then(() => {
      toast.info("Chat request cancelled");
      fetchEntries();
    });
  };

  const sendMessage = () => {
    if (!draft.trim() || status !== "accepted") return;
    axios
      .post(MESSAGES_API, {
        fromId: userId,
        toId: selectedUser.id,
        type: "chat",
        status: "accepted",
        text: draft.trim(),
        createdAt: new Date().toISOString(),
      })
      .then(() => {
        setDraft("");
        toast.success("Message sent");
        fetchEntries();
      });
  };

  // Logout with confirmation
  const handleLogout = () => {
    toast.info(
      <div className="flex flex-col">
        <span className="text-black font-semibold">Log out?</span>
        <div className="mt-2 flex justify-end space-x-2">
          <button
            className="px-3 py-0.5 border-2 bg-purple-600 border-purple-700 text-white rounded-full hover:bg-purple-500 hover:scale-102 ring-white"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 ring-2 ring-red-800"
            onClick={() => {
              toast.dismiss();
              toast.info("Logged out");
              setTimeout(() => {
                localStorage.clear();
                navigate("/login");
              }, 500);
            }}
          >
            Confirm
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
      }
    );
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [convo]);

  // Compute wrapper classes & style based on bgType
  const wrapperClasses = [
    "flex-1",
    "flex",
    "flex-col",
    "ml-0",
    "lg:ml-1/4",
    bgType === "gradient" &&
      "bg-gradient-to-tr from-purple-600 via-pink-500 to-red-400",
    bgType === "purple" && "bg-purple-600",
    bgType === "pink" && "bg-pink-600",
    bgType === "gray" && "bg-gray-800",
    bgType === "blue" && "bg-blue-800",
    bgType === "green" && "bg-green-800",
    bgType === "black" && "bg-black",
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperStyle =
    bgType === "image"
      ? {
          backgroundColor: "#000",
          backgroundImage: "url('Chat_background.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
        }
      : undefined;

  return (
    <>
      <ToastContainer position="top-center" />
      <div className="h-screen flex">
        {/* Sidebar */}
        <aside
          className={`text-white p-4 overflow-y-auto z-20 transform transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 w-full h-full lg:relative lg:w-1/4 lg:h-auto bg-purple-900`}
        >
          <div className="lg:hidden flex justify-end">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-white"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="p-2 mb-2 rounded bg-purple-800">
            <h3 className="font-semibold">Contacts</h3>
          </div>
          <ul className="mb-6">
            {acceptedContacts.map((u) => {
              const out = requests.some(
                (r) =>
                  r.fromId === userId &&
                  r.toId === u.id &&
                  r.status === "pending"
              );
              const inc = requests.some(
                (r) =>
                  r.fromId === u.id &&
                  r.toId === userId &&
                  r.status === "pending"
              );
              return (
                <li key={u.id} className="flex items-center">
                  <button
                    onClick={() => setSelectedUser(u)}
                    className={`flex-1 text-left px-3 py-2 mb-2 rounded transition ${
                      selectedUser?.id === u.id
                        ? "bg-purple-700"
                        : "hover:bg-purple-800"
                    }`}
                  >
                    {u.fullName}
                  </button>
                  {out && <FiClock className="ml-1 mb-2 text-pink-300" />}
                  {inc && <FiBell className="ml-1 mb-2 text-red-400" />}
                </li>
              );
            })}
            {!acceptedContacts.length && (
              <li className="text-sm text-pink-200">No contacts yet.</li>
            )}
          </ul>

          <div
            className="p-2 mb-2 rounded cursor-pointer flex justify-between items-center bg-purple-800"
            onClick={() => setAllUsersOpen(!allUsersOpen)}
          >
            <span className="font-semibold">All Users</span>
            {allUsersOpen ? <FiChevronDown /> : <FiChevronRight />}
          </div>
          {allUsersOpen && (
            <ul className="mb-6">
              {availableContacts.map((u) => {
                const out = requests.some(
                  (r) =>
                    r.fromId === userId &&
                    r.toId === u.id &&
                    r.status === "pending"
                );
                const inc = requests.some(
                  (r) =>
                    r.fromId === u.id &&
                    r.toId === userId &&
                    r.status === "pending"
                );
                return (
                  <li key={u.id} className="flex items-center">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className={`flex-1 text-left px-3 py-2 mb-2 rounded transition ${
                        selectedUser?.id === u.id
                          ? "bg-purple-700"
                          : "hover:bg-purple-800"
                      }`}
                    >
                      {u.fullName}
                    </button>
                    {out && <FiClock className="ml-1 mb-2 text-pink-300" />}
                    {inc && <FiBell className="ml-1 mb-2 text-red-400" />}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Chat area with dynamic bg */}
        <div className={wrapperClasses} style={wrapperStyle}>
          {/* Header */}
          <header className="flex items-center p-4 bg-black bg-opacity-50 text-white">
            <div className="lg:hidden mr-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-white"
              >
                <FiMenu size={24} />
              </button>
            </div>
            <h2 className="flex-1 text-lg font-medium">
              {selectedUser?.fullName || "Select a contact"}
            </h2>
            <div className="relative">
              <button
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="p-2 text-white"
              >
                <FiMoreVertical size={24} />
              </button>
              {showHeaderMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-purple-900 rounded-xl shadow-lg z-10">
                  {/* Background options */}
                  <div className="px-3 py-2 text-sm font-semibold text-pink-200">
                    Background
                  </div>
                  {[
                    ["Gradient", "gradient"],
                    ["Chat Image", "image"],
                    ["Purple", "purple"],
                    ["Pink", "pink"],
                    ["Gray", "gray"],
                    ["Blue", "blue"],
                    ["Green", "green"],
                    ["Black", "black"],
                  ].map(([label, type]) => (
                    <button
                      key={type}
                      onClick={() => {
                        setBgType(type);
                        setShowHeaderMenu(false);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-purple-800 text-white"
                    >
                      {label}
                    </button>
                  ))}
                  <hr className="border-purple-700 my-2" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 hover:bg-red-700 text-white"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main chat area */}
          <main className="flex-1 p-4 overflow-y-auto" ref={listRef}>
            {!selectedUser && (
              <p className="text-sm font-bold text-pink-200 bg-purple-700 p-1 px-2 rounded-2xl">
                No contact selected.
              </p>
            )}

            {selectedUser && status !== "accepted" && (
              <div className="mt-10 text-center space-y-4 flex flex-col justify-center items-center">
                {status === undefined && (
                  <>
                    <p className="text-sm font-bold text-white bg-purple-800 p-1 px-2 rounded-2xl">
                      Click to send a request
                    </p>
                    <button
                      onClick={sendRequest}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition ring-2 ring-pink-800"
                    >
                      Send Chat Request
                    </button>
                  </>
                )}
                {status === "pending" &&
                  (currentRequest.fromId === userId ? (
                    <>
                      <p className="text-sm font-bold text-white bg-purple-800 p-1 px-2 rounded-2xl">
                        Request pending
                      </p>
                      <button
                        onClick={cancelRequest}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ring-2 ring-red-800"
                      >
                        Cancel Request
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-white bg-purple-800 p-1 px-2 rounded-2xl">
                        Incoming request
                      </p>
                      <div className="inline-flex space-x-2">
                        <button
                          onClick={acceptRequest}
                          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition ring-2 ring-pink-800"
                        >
                          Accept
                        </button>
                        <button
                          onClick={cancelRequest}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ring-2 ring-red-800"
                        >
                          Decline
                        </button>
                      </div>
                    </>
                  ))}
              </div>
            )}

            {status === "accepted" &&
              convo.map((msg) => {
                const mine = msg.fromId === userId;
                // Format timestamp as HH:MM (24-hour)
                const timeLabel = new Date(msg.createdAt).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      mine ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Sender name + time */}
                    <span className="text-xs font-semibold text-white mb-1 bg-purple-800 p-0.5 px-2 rounded-xl flex items-center">
                      {mine ? currentUserName : selectedUser.fullName}
                    </span>

                    {/* Message bubble */}
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg break-words ${
                        mine
                          ? "bg-pink-700 border border-pink-900 text-white"
                          : "bg-purple-700 border border-purple-900 text-white"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="ml-2 text-[10px] text-gray-300">
                      {timeLabel}
                    </span>
                  </div>
                );
              })}
          </main>

          {/* Footer: input + send button */}
          {status === "accepted" && (
            <footer className="flex items-center p-4 bg-black bg-opacity-50">
              <input
                className="flex-1 rounded-full px-4 py-2 mr-2 bg-white bg-opacity-80 placeholder-purple-600 focus:outline-none"
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="p-3 bg-pink-600 rounded-full text-white hover:bg-pink-700 transition ring-2 ring-pink-800"
              >
                <FiSend size={20} />
              </button>
            </footer>
          )}
        </div>
      </div>
    </>
  );
}
