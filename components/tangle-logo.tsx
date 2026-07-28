"use client";

import { motion, useReducedMotion } from "framer-motion";

// hand-drawn "coil" mark — a spiral that winds round and round from the
// centre outward, like a brain spinning up ideas. echoes the loopy logo in
// /public/logo.png, but built as an inline svg path so it can animate: at
// rest it's a fully-drawn coil; on hover it re-draws itself from the centre
// out, over and over, so the coil keeps *forming* round and round.

// an elliptical archimedean spiral, wound from the middle outward. a gentle
// sine wobble keeps it feeling drawn-by-hand rather than machine-perfect.
function spiralPath() {
  const cx = 50;
  const cy = 46;
  const turns = 3.4;
  const steps = 240;
  const maxR = 37;
  const sx = 1.22; // wider than tall, like the original loops
  const sy = 0.82;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const wobble = 1 + 0.05 * Math.sin(angle * 3);
    const r = maxR * t * wobble;
    const x = cx + Math.cos(angle) * r * sx;
    const y = cy + Math.sin(angle) * r * sy;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

const SPIRAL_D = spiralPath();

export function TangleLogo({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 100 90"
      fill="none"
      aria-hidden="true"
      className={className}
      initial="rest"
      animate="rest"
      whileHover={shouldReduceMotion ? undefined : "hover"}
    >
      <motion.path
        d={SPIRAL_D}
        stroke="currentColor"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          rest: { pathLength: 1, transition: { duration: 0.4, ease: "easeOut" } },
          // redraw from the centre out once per hover — it winds round and
          // round to form the coil, then holds. hovering again replays it.
          hover: {
            pathLength: [0, 1],
            transition: { duration: 1.6, ease: "easeInOut" },
          },
        }}
      />
    </motion.svg>
  );
}
