import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export default function PremiumCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 30, stiffness: 350, mass: 0.5 };
  const cursorSpringX = useSpring(cursorX, springConfig);
  const cursorSpringY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Detect mobile viewport or touch support
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 || 
        navigator.maxTouchPoints > 0 || 
        "ontouchstart" in window
      );
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (isMobile) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 10);
      cursorY.set(e.clientY - 10);
    };

    // Listen for hover states across custom buttons and cards to scale
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest("button, a, [role='button'], input, .group, .cursor-pointer");
      if (clickable) {
        if (clickable.classList.contains("group") || clickable.classList.contains("cursor-pointer")) {
          setHovered("card");
        } else {
          setHovered("button");
        }
      } else {
        setHovered(null);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      {/* Outer Spring Follower Ring */}
      <motion.div
        id="premium-cursor-ring"
        style={{
          clientX: cursorSpringX,
          clientY: cursorSpringY,
          x: cursorSpringX,
          y: cursorSpringY,
        }}
        animate={{
          width: hovered === "button" ? 44 : hovered === "card" ? 64 : 20,
          height: hovered === "button" ? 44 : hovered === "card" ? 64 : 20,
          backgroundColor: hovered === "button" ? "rgba(99, 102, 241, 0.15)" : hovered === "card" ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0)",
          borderColor: hovered === "button" ? "rgba(99, 102, 241, 0.6)" : hovered === "card" ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.25)",
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.2 }}
        className="pointer-events-none fixed left-0 top-0 z-50 rounded-full border border-white/30 mix-blend-difference"
      />

      {/* Inner Pin Dot */}
      <motion.div
        id="premium-cursor-dot"
        style={{
          clientX: cursorSpringX,
          clientY: cursorSpringY,
          x: cursorSpringX,
          y: cursorSpringY,
        }}
        animate={{
          scale: hovered ? 0.4 : 1,
          backgroundColor: hovered === "button" ? "rgb(99, 102, 241)" : hovered === "card" ? "rgb(16, 185, 129)" : "rgb(255, 255, 255)",
        }}
        className="pointer-events-none fixed left-[8px] top-[8px] z-50 h-1 w-1 rounded-full text-white mix-blend-difference"
      />
    </>
  );
}
