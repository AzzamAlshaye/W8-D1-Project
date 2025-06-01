import React from "react";
import { Link } from "react-router";

export default function HomeScreen() {
  const isAuth = localStorage.getItem("isAuthenticated") === "true";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-tr from-purple-600 via-pink-500 to-red-400 flex items-center justify-center px-6">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-white opacity-10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-96 h-96 bg-white opacity-10 rounded-full animate-spin-slow"></div>
      <div className="absolute top-1/2 right-20 w-56 h-56 bg-white opacity-5 rounded-full"></div>

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-lg">
        <img
          src="logo.png"
          alt="Logo"
          className="mx-auto mb-6 w-24 h-24 sm:w-32 sm:h-32 bg-[#ffffff7c] rounded-3xl"
        />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg">
          Welcome to ChatSphere
        </h1>
        <p className="mt-4 text-white/90 text-base sm:text-lg md:text-xl">
          Dive into seamless, real-time conversations. Connect, share, and chat
          with friends in a beautiful, intuitive interface.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {isAuth ? (
            <Link
              to="/chat"
              className="inline-block px-8 py-3 bg-white text-purple-600 font-semibold rounded-full shadow-lg transform transition hover:scale-105"
            >
              Continue Chatting
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-block px-8 py-3 bg-white text-purple-600 font-semibold rounded-full shadow-lg transform transition hover:scale-105"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-full transform transition hover:bg-white hover:text-purple-600"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
