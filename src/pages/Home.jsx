import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ScrambleText } from './ScrambleText';
import ScrambleText2 from "./ScrambleText2";
import { loadFull } from 'tsparticles';
import { FaEnvelope,FaDiscord,FaLinkedin, FaGithub, FaTwitter, FaShieldAlt, FaVoteYea, FaUsers, FaChartBar, FaClock, FaLock } from "react-icons/fa";
import './Home.css';
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
  const paths = [
  "M10,10 L300,10 L300,150 L50,150 L50,250 L400,250",
  "M100,20 L100,200 L300,200 L300,50",
  "M50,250 L400,250 L400,50 L200,50",
];

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" },
  }),
};


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
    answer: "Only authorized Elections can create and manage elections through the Election panel.",
  },
];
  const teamMembers = [
  {
    name: "Suresh Bhanuka",
    role: "Blockchain Developer",

    img: "/public/s.JPG",
    linkedin: "https://www.linkedin.com/in/suresh-bhanuka/",
    github: "https://github.com/sureshbhanuka",
    twitter: "https://x.com/suresh_bhanuka",

    img: "/s.JPG",
    linkedin: "#",
    github: "#",
    twitter: "#",

  },
  {
    name: "Prasindu Deshan",
    role: "Full Stack Developer",
    img: "/p.jpg",
    linkedin: "#",
    github: "https://github.com/prasindu",
    twitter: "#",
  },
  {
    name: "Dinushka Malshan",
    role: "Full Stack Developer",

    img: "./public/d.JPG",
    linkedin: "https://linkedin.com/in/dinushka-malshan-3b8521292",
    github: "https://github.com/dinushkam",
    twitter: "https://x.com/DDMalshan",

    img: "/d.jpg",
    linkedin: "#",
    github: "#",
    twitter: "#",

  },
  {
    name: "Damindu Prasadith",
    role: "Frontend Engineer",

    img: "../public/d2.JPG",
    linkedin: "https://www.linkedin.com/in/damindu-prasadith-8193b1282",
    github: "https://github.com/Damiya2001",
    twitter: "https://x.com/Damiya2001",
    img: "/d2.jpg",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
   {
    name: "Chamoda Deshan",
    role: "Deployment Engineer",
    img: "/ch.jpg",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
   {
    name: "Sandun Amantha",
    role: "UI/UX Designer",

    img: "/public/a.JPEG",
    linkedin: "https://www.linkedin.com/in/sandun-amantha-047644355/",
    github: "https://github.com/Sandun-Amantha",
    img: "/a.jpeg",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
   {
    name: "Thamara Bhagya",
    role: "Security & Penetration Tester",

    img: "/public/t.JPEG",
    linkedin: "http://www.linkedin.com/in/thamarabhagya107",
    github: "https://github.com/ThamaraBhagya",
    twitter: "https://x.com/bhagyathamara?s=21",
    img: "/t.jpeg",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
];



const features = [
  { title: "Secure Voting", description: "End-to-end encrypted and tamper-proof.", icon: <FaShieldAlt /> },
  { title: "One-Person-One-Vote", description: "Linked with wallet, no duplicates.", icon: <FaVoteYea /> },
  { title: "Decentralized", description: "No central authority control.", icon: <FaUsers /> },
  { title: "Live Results", description: "Visual real-time vote counts.", icon: <FaChartBar /> },
  { title: "Timed Elections", description: "Automatic open and close.", icon: <FaClock /> },
  { title: "Private Elections", description: "Whitelist-based access control.", icon: <FaLock /> },
];
//feature cards
const FeatureCard = ({ title, description, icon, opacity }) => (
  <motion.div
    className="min-w-[250px] sm:min-w-[300px] h-[280px] sm:h-[300px] m-1 flex flex-col justify-center items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border dark:border-gray-700"
    style={{ opacity }}
  >
    <div className="text-4xl text-indigo-600 mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
    <p className="text-base text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

const containerRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        container.scrollLeft += direction * 1.5;
        setScrollLeft(container.scrollLeft);

        // Bounce back at ends
        if (
          container.scrollLeft + container.offsetWidth >= container.scrollWidth - 2 ||
          container.scrollLeft <= 2
        ) {
          setDirection((prev) => -prev);
        }
      }
    }, 15);

    return () => clearInterval(scrollInterval);
  }, [direction]);

  const getOpacity = (index) => {
    const base = index * 280; // card + gap width
    const delta = Math.abs(scrollLeft - base);
    if (delta > 500) return 0.3;
    if (delta > 300) return 0.6;
    return 1;
  };







  const buttonColors =  {
  Election: {
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

 
    const id = Date.now();
  //   const newSpark = {
  //     id,
  //     x,
  //     y,
  //     dx: (Math.random() - 0.5) * 50,
  //     dy: (Math.random() - 0.5) * 50,
  //   };

  //   setSparks((prev) => [...prev.slice(-200), newSpark]);

  //   setTimeout(() => {
  //     setSparks((prev) => prev.filter((s) => s.id !== id));
  //   }, 200);
  // };

  // useEffect(() => {
  //   window.addEventListener('mousemove', handleMouseMove);
  //   return () => window.removeEventListener('mousemove', handleMouseMove);
  // }, []);

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

 // 🧠 Mouse hover effect 3D background
const bgRef = useRef(null);

const handleMouseMove = (e) => {
  const bg = bgRef.current;
  if (!bg) return;

  const { width, height, left, top } = bg.getBoundingClientRect();
  const x = e.clientX - left;
  const y = e.clientY - top;

  const rotateX = ((y / height) - 0.5) * -15;
  const rotateY = ((x / width) - 0.5) * 15;

  bg.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
};

const handleMouseLeave = () => {
  const bg = bgRef.current;
  if (bg) bg.style.transform = `rotateX(0deg) rotateY(0deg)`;
};

return (
  <div className="min-h-screen w-full  bg-darkbg text-white">
    <div
      className="min-h-screen w-full flex  flex-col items-center justify-center relative overflow-hidden"
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ✅ 3D Tilt Background Image with ref attached */}
      <div
        ref={bgRef}
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center transition-transform duration-200 ease-out will-change-transform"
        style={{
          backgroundImage: 'url("/back4.jpg")',
          transformStyle: 'preserve-3d',
        }}
      />

      {/* 🔲 Optional: Dark overlay */}
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
        {["Election", "Vote", "Results"].map((label, i) => (
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
      
    
 



<section
  className="relative py-20 min-h-screen"
  style={{
    backgroundAttachment: "fixed",
    backgroundImage: "url('/your-background.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  {/* Neon Trails Background */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    {paths.map((d, i) => (
      <svg
        key={i}
        width="100%"
        height="100%"
        viewBox="0 0 1024 300"
        preserveAspectRatio="none"
        className="absolute top-0 left-0"
      >
        <path d={d} className="trail-path" />
      </svg>
    ))}
    {paths.map((d, i) => (
      <div
        key={`dot-${i}`}
        className="neon-dot"
        style={{
          offsetPath: `path("${d}")`,
          animation: `moveDot${(i % 2) + 1} ${8 + i * 2}s linear infinite`,
        }}
      />
    ))}
  </div>

  {/* Section Content */}
  <section className="w-full py-8 px-4 md:px-12 bg-[#0b0b0b]">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Key Features</h2>

      <div
        className="overflow-x-auto h-[300px]  whitespace-nowrap flex no-scrollbar"
        ref={containerRef}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            opacity={getOpacity(index)}
          />
        ))}
      </div>
    </section>
</section>

<h2 className="text-4xl md:text-5xl text-center font-bold text-white z-50 drop-shadow-lg">
       
          About Our Voting System
       
      </h2>
{/* About */}
   <section
  className="relative min-h-screen overflow-hidden py-20 flex items-center justify-center"
  style={{
    backgroundAttachment: "fixed",
    backgroundImage: "url('/your-background-image.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  {/* Overlay */}
 

  {/* Content Container */}
  <div className="relative z-10 max-w-7xl w-full px-6 flex flex-col lg:flex-row items-center justify-between gap-12">
    
    {/* 3D Scene (left on desktop) */}
    <div className="w-full lg:w-1/2 h-[400px] z-0 lg:h-[500px]">
      <Scene />
    </div>

    {/* Text content (right on desktop) */}
    <motion.div id='about'
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  viewport={{ once: true }}
  className="text-center lg:text-left z-10 max-w-xl"
>
  <ScrambleText2
    text="Our blockchain-based voting platform ensures transparency, security, and real-time verification through immutable ledger technology. Leveraging smart contracts, votes are automatically validated without human intervention, minimizing the risk of tampering or fraud. All data is stored in a decentralized manner, ensuring resilience against single points of failure.
     The platform supports both public and private elections, offering customizable access control. Designed for scalability and accessibility, it empowers every citizen to cast their vote safely, anonymously, and with full confidence in the integrity of the process."
   id="about" className=" font-hacker  text-blue-800"
  />
</motion.div>

  </div>
</section>

{/* features*/}

{/*team members*/}
<section className="text-white py-16 px-4 items-center place-items-center justify-center min-h-screen ">
      <h2 className="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10 place-items-center">

        {teamMembers.map((member, i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariants}
            className="bg-[#1e293b] border items-center  justify-center  border-gray-700 rounded-2xl shadow-2xl hover:scale-105 transform transition-all duration-500 w-72 text-center p-6"
          >
            {/* Circular Image with Overlay */}
            <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden group mb-4">
              <img
                src={member.img}
                alt={member.name}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-300"
              />
              {/* Black Hover Overlay */}
              
            </div>

            {/* Card Text */}
            <h3 className="text-2xl font-semibold">{member.name}</h3>
            <p className="text-sm text-gray-400">{member.role}</p>

            {/* Social Links */}
            <div className="flex justify-center gap-4 mt-3 text-xl text-gray-300">
              <a href={member.linkedin} className="hover:text-blue-500" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
              <a href={member.github} className="hover:text-white" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
              <a href={member.twitter} className="hover:text-blue-400" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
    {/*faqs*/}
   <section className="min-h-screen text-white py-20 px-6  relative overflow-hidden">
  {/* Blur Glow Background */}
  <div className="absolute inset-0 z-0">
   
    <div className="absolute top-70  right-0 w-72 h-72 bg-gray-400 opacity-30 blur-3xl rounded-full animate-pulse" />
  </div>

  <h2 className="text-4xl font-extrabold text-center mb-16 z-10 relative"> Frequently Asked Questions</h2>

  <div className="max-w-4xl mx-auto space-y-6 z-10 relative">
    {faqs.map((faq, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: i * 0.15 }}
        className="bg-[#0f172a]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300"
      >
        <button
          onClick={() => toggleFAQ(i)}
          className="w-full flex justify-between items-center text-left px-6 py-5 text-lg font-semibold hover:bg-[#1e293b]/70 transition"
        >
          <span>{faq.question}</span>
          <ChevronDown
            className={`transition-transform duration-300 ${
              openIndex === i ? "rotate-180 text-cyan-400" : "text-white"
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
              className="px-6 pb-5 text-gray-300"
            >
              <p className="leading-relaxed">{faq.answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    ))}
  </div>
</section>

  <footer className="relative   text-gray-300 py-16 px-6 overflow-hidden z-10">
      {/* Glowing background circle */}
      <div className="absolute w-80 h-80 bg-cyan-400 rounded-full opacity-20 blur-3xl bottom-0 top-30 left-0 -z-10"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 text-center md:text-left">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">VoteX</h2>
          <p className="text-sm leading-relaxed">
            Revolutionizing elections with blockchain. Vote with trust,
            transparency, and technology.
          </p>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-cyan-400">Home</a></li>
            <li><a href="/about" className="hover:text-cyan-400">About</a></li>
            <li><a href="/features" className="hover:text-cyan-400">Features</a></li>
            <li><a href="/elections" className="hover:text-cyan-400">Elections</a></li>
            <li><a href="/contact" className="hover:text-cyan-400">Contact</a></li>
          </ul>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-center md:justify-start gap-2">
              <FaEnvelope className="text-cyan-400" /> votex.org
            </li>
            <li className="flex items-center justify-center md:justify-start gap-2">
              <FaEnvelope className="text-cyan-400" /> votex@gmail.com
            </li>
          </ul>
        </motion.div>

        {/* Social */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
          <div className="flex justify-center md:justify-start space-x-4 text-xl">
            <a href="#" className="hover:text-cyan-400 transition"><FaTwitter /></a>
            <a href="#" className="hover:text-cyan-400 transition"><FaGithub /></a>
            <a href="#" className="hover:text-cyan-400 transition"><FaDiscord /></a>
          </div>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="mt-12 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} <span className="text-white font-semibold">VoteX</span>. All rights reserved.
      </div>
    </footer>


    </div>
    
  );
};

export default Home;
