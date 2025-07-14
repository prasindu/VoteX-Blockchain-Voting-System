import React from 'react';
import { FaVoteYea } from 'react-icons/fa';

const Preloader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-black text-white flex-col animate-fade-in">
      {/* Neon Icon */}
      <FaVoteYea
        size={90}
        className="mb-6 text-purple-500 drop-shadow-[0_0_20px_rgba(168,85,247,0.9)] animate-bounce"
      />

      {/* Neon Title */}
      <h1 className="text-5xl font-extrabold tracking-widest text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse">
        ELECTION
      </h1>

      {/* Neon Subtitle */}
      <p className="mt-4 text-base text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.7)] italic">
        Securing Democracy...
      </p>
    </div>
  );
};

export default Preloader;

