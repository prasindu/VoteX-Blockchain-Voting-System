import { useState } from "react";

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

export const ScrambleText = ({ text, duration = 300 }) => {
  const [displayed, setDisplayed] = useState(text);

  const scramble = () => {
    let frame = 0;
    let interval = 30;
    const totalFrames = duration / interval;

    const animate = () => {
      const progress = frame / totalFrames;
      const newText = text
        .split("")
        .map((char, i) => {
          if (i < Math.floor(text.length * progress)) return char;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");
      setDisplayed(newText);
      frame++;
      if (frame <= totalFrames) {
        setTimeout(animate, interval);
      } else {
        setDisplayed(text);
      }
    };

    animate();
  };

  return (
    <span
      onMouseEnter={scramble}
      style={{ display: "inline-block", cursor: "pointer" }}
    >
      {displayed}
    </span>
  );
};
