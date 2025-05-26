import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';

import { loadFull } from 'tsparticles';
import Scene from './scene';
import './SnakeBackground.css';
import { useCallback } from 'react';
import Particles from 'react-tsparticles';
 // Add this import
import { loadSlim } from 'tsparticles-slim'; // Use loadSlim instead of loadFull
import Spline from '@splinetool/react-spline';

function Home() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [sparks, setSparks] = useState([]);
  const [titleIndex, setTitleIndex] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  const titles = [
    "Secure AI Voting on Blockchain",
    "Decentralized Elections for the Future",
    "AI-Powered Tamper-Proof Voting",
  ];

  const subtitles = [
    "Experience decentralized, tamper-proof elections powered by Blockchain and AI.",
    "Your voice. Your vote. Powered by cutting-edge technology.",
    "Trust in technology. Vote with confidence.",
  ];

  const particlesInit = useCallback(async (engine) => {
  await loadSlim(engine);
}, []);

  const handleMouseMove = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    setPosition({ x, y });

    const id = Date.now();
    const newSpark = {
      id,
      x,
      y,
      dx: (Math.random() - 0.5) * 50,
      dy: (Math.random() - 0.5) * 50,
    };

    setSparks((prev) => [...prev.slice(-200), newSpark]);

    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== id));
    }, 200);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const generatePath = (offsetY) => {
    const control = (position.x / window.innerWidth) * 100 + 200;
    const y = (position.y / window.innerHeight) * 100;
    return `M0 ${offsetY} Q${control} ${y}, 1000 ${offsetY}`;
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #0f172a, #1e40af, #7e22ce)',
      }}
    >
      {/* Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-0"
        options={{
          fullScreen: { enable: false },
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 120,
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: "push",
              },
              onHover: {
                enable: true,
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 4,
              },
              repulse: {
                distance: 100,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.3,
              width: 1,
            },
            collisions: {
              enable: true,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 2,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.5,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
      />

      {/* Dynamic SVG Curves */}
      <svg
        className="absolute inset-0 z-1 pointer-events-none opacity-70"
        width="100%"
        height="100%"
      >
        {[100, 300, 500].map((yOffset, index) => (
          <path
            key={index}
            d={generatePath(yOffset)}
            fill="none"
            stroke="#ffffff22"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Spark Effects */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {sparks.map((spark) => (
          <div
            key={spark.id}
            className="spark"
            style={{
              left: spark.x,
              top: spark.y,
              transform: `translate(${spark.dx}px, ${spark.dy}px)`,
            }}
          />
        ))}
      </div>

      {/* Animated Title & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center text-white z-20 mb-8"
      >
        <AnimatePresence mode="wait">
          <motion.h1
            key={titles[titleIndex]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg"
          >
            {titles[titleIndex]}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={subtitles[subtitleIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto"
          >
            {subtitles[subtitleIndex]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Navigation Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 z-20 mb-10"
      >
        {['Admin', 'Vote', 'Results'].map((label, i) => (
          <Link to={`/${label.toLowerCase()}`} key={i}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-${label === 'Admin' ? 'blue' : label === 'Vote' ? 'green' : 'purple'}-600 hover:bg-${label === 'Admin' ? 'blue' : label === 'Vote' ? 'green' : 'purple'}-700 transition duration-300 text-white p-4 rounded-xl shadow-lg font-semibold text-lg text-center`}
            >
              {label}
            </motion.div>
          </Link>
        ))}
      </motion.div>
      
      {/* 3D Box */}
      <div className="absolute bottom-10 right-10 w-[320px] h-[320px] z-10 pointer-events-none">
            <Spline
        scene="https://prod.spline.design/4COWJu1J-CKrMzVz/scene.splinecode" 
      />
      </div>
    </div>
  );
}

export default Home;