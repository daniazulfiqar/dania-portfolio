"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

// small uppercase eyebrow over the fold.
const EYEBROW = "what is this place?";

// the statement that types itself out, in the same voice as the note.
const STATEMENT =
  "a little archive of the problems i couldn't put down — what i tried, what broke, and the good ones worth keeping.";

// ms per character — lower is faster.
const TYPE_SPEED = 30;

export function IntroStatement() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  // once the fold scrolls into view (a little before fully centred), start
  // typing. `once` so it types a single time and then stays put.
  const inView = useInView(sectionRef, { once: true, margin: "-25% 0px" });

  const [count, setCount] = useState(0);
  const started = inView && !shouldReduceMotion;

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= STATEMENT.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, TYPE_SPEED);
    return () => clearInterval(id);
  }, [started]);

  // reduced motion (or no JS animation) just shows the whole thing.
  const shown = shouldReduceMotion ? STATEMENT : STATEMENT.slice(0, count);
  const done = shouldReduceMotion || count >= STATEMENT.length;

  return (
    <section
      ref={sectionRef}
      className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-24"
    >
      <p className="mb-10 text-center font-body text-xs uppercase tracking-[0.25em] text-ink-soft sm:text-sm">
        {EYEBROW}
      </p>

      <h2 className="max-w-4xl text-center font-display text-3xl italic leading-tight text-ink sm:text-5xl sm:leading-[1.15]">
        {shown}
        {/* blinking caret — visible while typing, fades away once done. */}
        <span
          aria-hidden="true"
          className={`ml-0.5 inline-block w-[0.06em] self-stretch bg-ink align-[-0.05em] ${
            done
              ? "opacity-0"
              : "animate-[blink_1s_step-end_infinite]"
          }`}
          style={{ height: "0.9em" }}
        >
          &nbsp;
        </span>
      </h2>
    </section>
  );
}
