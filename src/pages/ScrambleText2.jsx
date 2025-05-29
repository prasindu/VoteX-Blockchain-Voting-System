import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

const scrambleLetter = () => {
  return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
};

const scrambleText = (original, progress) => {
  return original
    .split("")
    .map((char, i) => {
      if (char === " " || i < Math.floor(progress * original.length)) {
        return char;
      }
      return scrambleLetter();
    })
    .join("");
};

const ScrambleText2 = ({ text, duration = 1, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  const [displayText, setDisplayText] = useState(text);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let frame = 0;
    const fps = 60;
    const totalFrames = duration * fps;

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      setDisplayText(scrambleText(text, progress));

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isInView, key, text, duration]);

  // Restart scramble on scroll back into view
  useEffect(() => {
    if (isInView) {
      setKey((prev) => prev + 1);
    }
  }, [isInView]);

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`text-gray-300 text-lg leading-relaxed tracking-wide ${className}`}
    >
      {displayText}
    </motion.p>
  );
};

export default ScrambleText2;
