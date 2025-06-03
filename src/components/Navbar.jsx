// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router";
import {
  FaBars,
  FaSearch,
  FaTimes,
  FaUserCircle,
  FaEllipsisV,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Navbar({
  mode,
  searchTerm,
  setSearchTerm,
  suggestions = [],
  suggestionsRef = null,
  onSuggestionClick,
  onSearchSubmit,
  onHomeClick,
}) {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  // Clears the searchTerm when X is clicked
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Logout confirmation logic
  const handleLogout = () => {
    const ConfirmationToast = () => (
      <div className="flex flex-col space-y-2 text-black">
        <span>Are you sure you want to log out?</span>
        <div className="flex justify-end space-x-2">
          <button
            onClick={confirmLogout}
            className="bg-red-600 text-white px-3 py-1 rounded focus:outline-none"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="bg-gray-300 text-gray-800 px-3 py-1 rounded focus:outline-none"
          >
            No
          </button>
        </div>
      </div>
    );

    toast.info(<ConfirmationToast />, {
      position: "top-right",
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      className: "bg-white",
    });
  };

  const confirmLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    toast.dismiss();
    toast.success("Logged out successfully.", { position: "top-right" });
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 bg-neutral-900 px-4 py-2 flex items-center">
      {/* ─── Left: Hamburger + Logo + “SA” ─── */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            /* your side‐menu toggle logic here */
          }}
          className="text-white focus:outline-none"
        >
          <FaBars size={24} />
        </button>

        <img
          src="/logo-w.svg"
          alt="YouTube logo"
          className="h-6 cursor-pointer"
          onClick={onHomeClick}
        />

        <span className="text-white text-xs font-semibold">SA</span>
      </div>

      {/* ─── Center: Search Box ─── */}
      <form
        onSubmit={onSearchSubmit}
        className="flex flex-1 justify-center mx-4"
      >
        <div className="relative w-full max-w-2xl" ref={suggestionsRef}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="
              w-full
              rounded-full
              bg-neutral-800
              text-white
              placeholder-gray-400
              py-2
              pl-4
              pr-12
              focus:outline-none
            "
            autoComplete="off"
          />

          {/* Clear (X) button when there is text */}
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="
                absolute
                right-10
                top-1/2
                transform -translate-y-1/2
                text-gray-400
                hover:text-white
                focus:outline-none
              "
            >
              <FaTimes size={16} />
            </button>
          )}

          {/* Search (magnifying glass) button */}
          <button
            type="submit"
            className="
              absolute
              right-2
              top-1/2
              transform -translate-y-1/2
              bg-neutral-700
              hover:bg-neutral-600
              px-3
              py-1
              rounded-full
              focus:outline-none
            "
          >
            <FaSearch size={16} className="text-white" />
          </button>

          {/* Suggestions dropdown (optional) */}
          {Array.isArray(suggestions) && suggestions.length > 0 && (
            <ul
              className="
                absolute
                top-full
                left-0
                w-full
                bg-white
                text-black
                mt-1
                rounded-md
                shadow-lg
                z-20
                max-h-60
                overflow-y-auto
              "
            >
              {suggestions.map((sugg, idx) => (
                <li
                  key={`${sugg}-${idx}`}
                  className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => onSuggestionClick(sugg)}
                >
                  {sugg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {/* ─── Right: Auth / Sign‐in / Avatar ─── */}
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            {/* Show user icon + Logout button when authenticated */}
            <FaUserCircle size={28} className="text-white" />

            <button
              onClick={handleLogout}
              className="
                bg-neutral-700
                hover:bg-neutral-600
                px-3
                py-1
                rounded
                text-white
                focus:outline-none
              "
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Three-dot menu icon (⋮) */}
            <button
              onClick={() => {
                /* optional menu logic */
              }}
              className="text-white focus:outline-none"
            >
              <FaEllipsisV size={20} />
            </button>

            {/* Sign in button styled exactly like your screenshot */}
            <Link
              to="/login"
              className="
                flex
                items-center
                space-x-1
                border
                border-white
                rounded-full
                px-3
                py-1
                text-white
                hover:bg-white
                hover:text-black
                focus:outline-none
              "
            >
              <FaUserCircle size={16} />
              <span className="text-sm font-medium">Sign in</span>
            </Link>
          </>
        )}
      </div>

      {/* ToastContainer (required for toasts) */}
      <ToastContainer />
    </header>
  );
}
