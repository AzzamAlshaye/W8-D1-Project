// src/components/Navbar.jsx

import React from "react";

export default function Navbar({
  mode,
  searchTerm,
  setSearchTerm,
  suggestions = [], // ← default to empty array
  suggestionsRef = null, // ← default to null if no ref passed
  onSuggestionClick,
  onSearchSubmit,
  onHomeClick,
}) {
  return (
    <header className="sticky top-0 z-10 bg-neutral-900 p-4 flex items-center space-x-4">
      <img
        src="logo-w.svg"
        alt="youtube logo"
        className="h-6"
        onClick={onHomeClick}
      />

      <form
        onSubmit={onSearchSubmit}
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

          {/* only attempt to render suggestions if ‘suggestions’ is a non‐empty array */}
          {Array.isArray(suggestions) && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 w-full bg-white text-black mt-1 rounded shadow-lg z-20 max-h-60 overflow-y-auto">
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

        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-r-md"
        >
          Search
        </button>
      </form>
    </header>
  );
}
