"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { TangleLogo } from "./tangle-logo";

const NAME = "dania siddiqui";

// the wordmark, letter by letter, so hovering the name sends a little wave
// through it — each letter lifts and settles in turn, left to right.
function AnimatedName() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      className="font-heading text-base font-semibold leading-none tracking-tight sm:text-lg"
      initial="rest"
      animate="rest"
      whileHover={shouldReduceMotion ? undefined : "hover"}
      variants={{ hover: { transition: { staggerChildren: 0.025 } } }}
    >
      {NAME.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{ rest: { y: 0 }, hover: { y: [0, -5, 0] } }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function BrandMark() {
  return (
    <Link href="/" className="group flex items-center gap-1 text-ink">
      <TangleLogo className="h-5 w-7 shrink-0 sm:h-6 sm:w-8" />
      <AnimatedName />
    </Link>
  );
}
