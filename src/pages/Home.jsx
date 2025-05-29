import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ScrambleText } from './ScrambleText';
import { loadFull } from 'tsparticles';
import './home.css';
import Scene from './scene';
import './SnakeBackground.css';
import { useCallback } from 'react';
import Particles from 'react-tsparticles';
 // Add this import
import { loadSlim } from 'tsparticles-slim'; // Use loadSlim instead of loadFull
import Spline from '@splinetool/react-spline';
import { ChevronDown } from "lucide-react";
function Home() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [sparks, setSparks] = useState([]);
  const [titleIndex, setTitleIndex] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
const faqs = [
  {
    question: "What is this voting system built on?",
    answer: "Our system is built using blockchain technology with smart contracts for secure and transparent elections.",
  },
  {
    question: "Can I vote more than once?",
    answer: "No, each user is allowed to vote only once per election using their verified MetaMask wallet.",
  },
  {
    question: "Is my vote anonymous?",
    answer: "Yes, votes are recorded securely and anonymously on the blockchain.",
  },
  {
    question: "How are results displayed?",
    answer: "Results are shown in real-time with charts and downloadable CSV reports after the election ends.",
  },
  {
    question: "Can anyone create an election?",
    answer: "Only authorized admins can create and manage elections through the admin panel.",
  },
];
  const teamMembers = [
  { name: "Alice", role: "Blockchain Dev", img: "/team/alice.jpg" },
  { name: "Bob", role: "Frontend Dev", img: "/team/bob.jpg" },
  { name: "Charlie", role: "Smart Contract Auditor", img: "/team/charlie.jpg" },
  { name: "Diana", role: "UI/UX Designer", img: "/team/diana.jpg" },
  { name: "Eve", role: "Backend Dev", img: "/team/eve.jpg" },
  { name: "Frank", role: "Project Manager", img: "/team/frank.jpg" },
  { name: "Grace", role: "QA Engineer", img: "/team/grace.jpg" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2 },
  }),
};


const features = [
  {
    title: "Secure Voting",
    description:
      "Blockchain-powered, tamper-proof votes ensure absolute integrity and transparency.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2l4-4" />
      </svg>
    ),
  },
  {
    title: "Real-Time Results",
    description:
      "Instantly view live election outcomes powered by smart contract automation.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
      </svg>
    ),
  },
  {
    title: "User-Friendly Interface",
    description:
      "Intuitive UI with smooth animations makes voting easy for everyone.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-purple-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
      </svg>
    ),
  },
   {
    title: "Secure Voting",
    description:
      "Blockchain-powered, tamper-proof votes ensure absolute integrity and transparency.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2l4-4" />
      </svg>
    ),
  },
   {
    title: "Secure Voting",
    description:
      "Blockchain-powered, tamper-proof votes ensure absolute integrity and transparency.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2l4-4" />
      </svg>
    ),
  },
];

  const buttonColors =  {
  Admin: {
    base: "bg-transparent border border-blue-500",
    hover: "hover:shadow-[0_0_20px_#3b82f6] hover:text-blue-400",
  },
  Vote: {
    base: "bg-transparent border border-green-500",
    hover: "hover:shadow-[0_0_20px_#22c55e] hover:text-green-400",
  },
  Results: {
    base: "bg-transparent border border-purple-500",
    hover: "hover:shadow-[0_0_20px_#a855f7] hover:text-purple-400",
  },
};
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
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className='min-h-screen w-full bg-darkbg text-white'>
    <div
  className="min-h-screen flex flex-col items-center justify-center px-4  relative overflow-hidden"
>
  {/* 🔁 Background Video */}
  <video
    autoPlay
    loop
    muted
    playsInline
    className="absolute top-0 left-0 w-full h-full object-cover z-0"
  >
    <source src="/6.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>

  {/* 🔲 Optional: Dark overlay for contrast */}
  {/* <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-0" /> */}

  {/* ✨ Animated Title & Subtitle */}
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

  {/* 📦 Navigation Cards */}
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.6 }}
    className="grid grid-cols-1 md:grid-cols-3 gap-6 z-20 mb-10"
  >
    {["Admin", "Vote", "Results"].map((label, i) => (
      <Link to={`/${label.toLowerCase()}`} key={i}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`transition duration-300 text-white p-4 rounded-xl shadow-lg font-semibold text-lg text-center ${buttonColors[label].base} ${buttonColors[label].hover}`}
        >
          <ScrambleText text={label} />
        </motion.div>
      </Link>
    ))}
  </motion.div>
</div>
{/* About */}
    <section
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-900 via-black to-gray-900 py-20"
      style={{
        backgroundAttachment: "fixed", // Parallax effect
        backgroundImage: "url('/your-background-image.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
     

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          About Our Voting System
        </h2>
        <p className="text-gray-300 text-lg leading-relaxed">
          Our blockchain-based voting platform ensures transparency, security,
          and real-time verifiability. Powered by smart contracts and
          decentralized storage, it enables every citizen to vote safely and
          confidently.
        </p>
      </motion.div>
    </section>
{/* features*/}
<section
  className="relative py-20 min-h-screen"
  style={{ backgroundAttachment: "fixed", backgroundImage: "url('/your-background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} // Parallax background image
>
  {/* Dark overlay */}
  <div className="absolute inset-0  bg-opacity-60 -z-10" />

  <div className="max-w-7xl mx-auto px-6 text-center">
    <motion.h2
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="text-4xl font-extrabold text-white mb-12"
    >
      Key Features
    </motion.h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {features.slice(0, 5).map(({ title, description, icon }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.3 }}
          whileHover={{ scale: 1.05 }}
          className="relative bg-gray-800 bg-opacity-70 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center cursor-pointer
            border border-transparent hover:border-white
            transition-all duration-300 ease-in-out overflow-hidden"
        >
          {/* Glow ring */}
          <span
            className="absolute inset-0 rounded-2xl pointer-events-none
              border-2 border-white opacity-0 hover:opacity-100
              transition-opacity duration-500 animate-glow"
            style={{ boxShadow: "0 0 15px 5px rgba(255,255,255,0.5)" }}
          />

          <div className="mb-6 z-10">{icon}</div>
          <h3 className="text-xl font-semibold text-white mb-3 z-10">{title}</h3>
          <p className="text-gray-300 z-10">{description}</p>
        </motion.div>
      ))}
    </div>
  </div>
</section>
{/*team members*/}
<section className=" text-white py-16 px-4 min-h-screen">
      <h2 className="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
        {teamMembers.map((member, i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariants}
            className="bg-[#1e293b] rounded-2xl overflow-hidden shadow-lg hover:scale-105 hover:rotate-1 transform transition-all duration-300 w-72"
          >
            <img
              src={member.img}
              alt={member.name}
              className="w-full h-60 object-cover"
            />
            <div className="p-5 text-center">
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-sm text-gray-400">{member.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
    {/*faqs*/}
    <section className="min-h-screen text-white py-16 px-4">
      <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-[#1e293b] rounded-xl shadow-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(i)}
              className="w-full flex justify-between items-center text-left px-6 py-4 text-lg font-medium hover:bg-[#334155] transition"
            >
              {faq.question}
              <ChevronDown
                className={`transform transition-transform ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-4 text-gray-300"
                >
                  <p>{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>

    </div>
  );
}

export default Home;