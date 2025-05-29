import React from 'react';
import { FaVoteYea } from 'react-icons/fa';

const Preloader = () => {
  return (
   <div className="flex items-center justify-center h-screen bg-black text-white flex-col animate-fade-in">
      {/* Neon Icon */}
      <FaVoteYea
        size={80}
        className="mb-4 text-neon-purple drop-shadow-[0_0_10px_rgba(255,0,255,0.7)] animate-bounce"
      />

      {/* Neon Title */}
      <h1 className="text-4xl font-bold tracking-widest text-neon-cyan drop-shadow-[0_0_12px_rgba(0,255,255,0.8)]">
        Election
      </h1>

      {/* Neon Subtitle */}
      <p className="mt-2 text-sm text-neon-pink drop-shadow-[0_0_6px_rgba(255,20,147,0.6)]">
        Securing Democracy...
      </p>
    </div>
  );
};

export default Preloader;
