"use client";

import { motion, useReducedMotion } from "framer-motion";
import { goodOnes } from "@/lib/good-ones";

// small uppercase eyebrow, same convention as the intro statement fold.
const EYEBROW = "some of the good ones";

// placeholder "photo" for each card, until real project screenshots exist —
// a distinct tinted gradient per card so they read as separate pieces of
// work rather than four identical boxes, using the site's own palette.
const CARD_TONES = [
  "linear-gradient(160deg, var(--color-wax), var(--color-ink))",
  "linear-gradient(160deg, var(--color-ochre), var(--color-ink))",
  "linear-gradient(160deg, var(--color-kraft-dark), var(--color-ink))",
  "linear-gradient(160deg, var(--color-ink-soft), var(--color-ink))",
];

// fade + rise, triggered once when scrolled into view — used by both the
// heading and the cards below so the fold reads as a deliberate reveal
// rather than content that was just sitting cramped near the fold above.
const RISE_IN = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0 },
};

export function ProjectsFold() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="flex min-h-screen flex-col justify-center bg-paper px-6 py-16">
      <motion.p
        className="mb-8 text-center font-body text-xs uppercase tracking-[0.25em] text-ink-soft sm:text-sm"
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="shown"
        viewport={{ once: true, margin: "0px 0px -50% 0px" }}
        variants={RISE_IN}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {EYEBROW}
      </motion.p>

      <div className="mx-auto grid max-w-[100rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {goodOnes.map((project, index) => (
          <motion.div
            key={project.id}
            className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-md"
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView="shown"
            viewport={{ once: true, margin: "0px 0px -50% 0px" }}
            variants={RISE_IN}
            transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
          >
            {/* placeholder image box — swap for a real project screenshot */}
            <div
              className="absolute inset-0"
              style={{ background: CARD_TONES[index % CARD_TONES.length] }}
              aria-hidden="true"
            />
            {/* scrim so the text stays legible over whatever sits behind it */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
              aria-hidden="true"
            />

            <div className="relative flex h-full flex-col justify-between p-6">
              <span className="w-fit rounded-full bg-white/15 px-3.5 py-1.5 font-body text-xs uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <h3 className="font-display text-2xl italic text-white sm:text-3xl">
                  {project.title}
                </h3>
                <p className="mt-2 font-body text-sm text-white/75 sm:text-base">
                  {project.summary}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
