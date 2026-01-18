
import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState("");

  const handleSearch = () => {
    if (q.trim()) {
      onSearch(q);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row w-full max-w-xl gap-2 sm:gap-0">
      <input
        className="flex-1 border px-4 py-2 rounded sm:rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search Roll / Name / Mobile"
        onChange={e => setQ(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button
        className="bg-blue-700 text-white px-6 py-2 rounded sm:rounded-r hover:bg-blue-800 transition-colors"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>
  );
}
