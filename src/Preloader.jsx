import React from 'react';
import { FaVoteYea } from 'react-icons/fa';

const Preloader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-blue-700 text-white flex-col animate-fade-in">
      <FaVoteYea size={80} className="animate-bounce mb-4" />
      <h1 className="text-3xl font-bold tracking-widest">Election </h1>
      <p className="mt-2 text-sm opacity-75">Securing Democracy...</p>
    </div>
  );
};

export default Preloader;
