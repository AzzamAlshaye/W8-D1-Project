// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FiMenu, FiX, FiSearch } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Temp() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Auth state & user info ---
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const fullName = localStorage.getItem("fullName") || "";

  // --- Logout logic (with confirmation toast) ---
  const performLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    localStorage.removeItem("UserImage");
    toast.success("You have been logged out.", { position: "top-center" });
    navigate("/");
  };

  const confirmLogout = () => {
    const LogoutConfirm = ({ closeToast }) => (
      <div className="p-2">
        <p className="mb-2">Are you sure you want to log out?</p>
        <div className="flex justify-end space-x-2">
          <button
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              performLogout();
              closeToast();
            }}
          >
            Yes
          </button>
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={() => closeToast()}
          >
            No
          </button>
        </div>
      </div>
    );

    toast.info(<LogoutConfirm />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
    });
  };

  return (
    <>
      <ToastContainer />

      {/** ─── Main Navbar Container ─── **/}
      <nav className="bg-neutral-900 text-white py-3">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center">
            {/** ─── Left: Logo (always visible) ─── **/}
            <Link to="/" className="flex items-center mr-4">
              <img
                src="/logo-w.svg"
                alt="YouTube‐Style Logo"
                className="h-8 w-auto"
              />
              <span className="ml-1 text-xs font-semibold">SA</span>
            </Link>

            {/** ─── Search Bar (visible at lg and above) ─── **/}
            <div className="hidden lg:flex flex-1 items-center mx-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search"
                  className="
                    w-full
                    bg-neutral-800
                    text-white
                    placeholder-gray-400
                    rounded-l-md
                    py-2
                    pl-3
                    focus:outline-none
                  "
                />
                <button
                  className="
                    absolute
                    right-0
                    top-0
                    bottom-0
                    bg-neutral-700
                    hover:bg-neutral-600
                    px-3
                    rounded-r-md
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiSearch className="text-white" />
                </button>
              </div>
            </div>

            {/** ─── Horizontal Links (visible at lg and above) ─── **/}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Home */}
              <Link
                to="/"
                className="flex items-center space-x-1 hover:opacity-80 transition"
              >
                <img src="/home.svg" alt="Home" className="h-6 w-6" />
                <span className="text-sm">Home</span>
              </Link>

              {/* Shorts (does nothing) */}
              <button
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-1 hover:opacity-80 transition"
              >
                <img src="/shorts.svg" alt="Shorts" className="h-6 w-6" />
                <span className="text-sm">Shorts</span>
              </button>

              {/* Subscriptions (does nothing) */}
              <button
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-1 hover:opacity-80 transition"
              >
                <img
                  src="/Subscriptions.svg"
                  alt="Subscriptions"
                  className="h-6 w-6"
                />
                <span className="text-sm">Subscriptions</span>
              </button>

              {/* Liked Videos */}
              <Link
                to="/liked"
                className="flex items-center space-x-1 hover:opacity-80 transition"
              >
                <img src="/liked.svg" alt="Liked" className="h-6 w-6" />
                <span className="text-sm">Liked</span>
              </Link>
            </div>

            {/** ─── Right: Auth Block (visible at lg and above) ─── **/}
            <div className="hidden lg:flex items-center ml-auto">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <FaUserCircle size={24} className="text-white" />
                  <span className="text-sm">
                    Hello, {fullName.split(" ")[0]}
                  </span>
                  <button
                    onClick={confirmLogout}
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
                    Sign Out
                  </button>
                </div>
              ) : (
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
              )}
            </div>

            {/** ─── Mobile: Hamburger Menu Button (visible below lg) ─── **/}
            <div className="ml-auto lg:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? (
                  <FiX className="text-2xl text-white" />
                ) : (
                  <FiMenu className="text-2xl text-white" />
                )}
              </button>
            </div>
          </div>

          {/** ─── Mobile Dropdown (only when menuOpen=true & below lg) ─── **/}
          {menuOpen && (
            <div className="lg:hidden bg-neutral-800 border-t border-gray-700">
              <div className="px-4 py-3 space-y-4">
                {/** ‣ Mobile Search Box ‣ */}
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search"
                    className="
                      flex-1
                      bg-neutral-700
                      text-white
                      placeholder-gray-400
                      px-3
                      py-2
                      rounded-l-md
                      focus:outline-none
                    "
                  />
                  <button className="bg-neutral-600 hover:bg-neutral-500 p-2 rounded-r-md">
                    <FiSearch className="text-white" />
                  </button>
                </div>

                {/** ‣ Mobile Links ‣ */}
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="block text-white hover:text-gray-300"
                >
                  Home
                </Link>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="block text-white hover:text-gray-300"
                >
                  Shorts
                </button>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="block text-white hover:text-gray-300"
                >
                  Subscriptions
                </button>
                <Link
                  to="/liked"
                  onClick={() => setMenuOpen(false)}
                  className="block text-white hover:text-gray-300"
                >
                  Liked
                </Link>

                {/** ‣ Mobile Auth Block ‣ */}
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <span className="text-white">
                      Hello, {fullName.split(" ")[0]}
                    </span>
                    <button
                      onClick={() => {
                        confirmLogout();
                        setMenuOpen(false);
                      }}
                      className="text-red-500 font-semibold"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block text-white hover:underline"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
