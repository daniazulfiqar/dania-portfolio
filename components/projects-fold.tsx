"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { goodOnes, type GoodOne, type GoodOneIcon } from "@/lib/good-ones";

// small uppercase eyebrow, same convention as the intro statement fold.
const EYEBROW = "some of the good ones";

// the entire scatter effect: a baked-in tilt per card, hardcoded, never
// computed from scroll. index 0..3 map to the four cards in lib/good-ones.
const ROTATIONS = [-3, 2, -1, 4];

// where each card sits on the desk at lg and up: two outer columns of two,
// with the folder graphic filling the middle. placed on the grid rather than
// absolutely positioned so a long summary can never make two cards collide.
// the `mt` on the second and fourth breaks the rows out of lockstep so it
// still reads as scattered, not as a table.
const SPOTS = [
  "lg:col-start-1 lg:row-start-1",
  "lg:col-start-3 lg:row-start-1 lg:mt-14",
  "lg:col-start-3 lg:row-start-2",
  "lg:col-start-1 lg:row-start-2 lg:mt-14",
];

// on load: the container staggers its children, each of which fades in and
// rises. that's the whole entrance.
const STAGGER_CONTAINER = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

// the card's tilt is baked into both states so the entrance never fights it —
// framer resolves `initial`/`animate` from these, and the hover below just
// overrides `rotate` back to 0.
const cardIn = (rotate: number) => ({
  hidden: { opacity: 0, y: 28, rotate },
  shown: {
    opacity: 1,
    y: 0,
    rotate,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
});

// small abstract anchors — never a real screenshot, just a simple shape
// hinting at the kind of work (a chart, a trend line, a before/after split,
// a gauge).
function IconAnchor({ icon }: { icon: GoodOneIcon }) {
  const common = {
    viewBox: "0 0 48 48",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "trend":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 34 L18 22 L26 28 L42 10" />
          <path d="M32 10 H42 V20" />
        </svg>
      );
    case "compare":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="10" width="16" height="28" rx="2" />
          <rect x="28" y="10" width="16" height="28" rx="2" opacity="0.4" />
          <path d="M22 24 H26" />
          <path d="M24 21 L27 24 L24 27" />
        </svg>
      );
    case "gauge":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 32 a18 18 0 0 1 36 0" />
          <path d="M24 32 L34 19" />
          <circle cx="24" cy="32" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "chart":
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8 36 V24" />
          <path d="M18 36 V16" />
          <path d="M28 36 V26" />
          <path d="M38 36 V10" />
        </svg>
      );
  }
}

// same ruled-notebook-paper technique as the envelope note (linear-gradient
// rules + a left margin line) so the cards read as pages pulled from the
// same stationery, not a generic white rectangle.
const linedPaperStyle: CSSProperties = {
  backgroundColor: "#fdfbf3",
  backgroundImage: "linear-gradient(rgba(91,58,41,0.16) 1px, transparent 1px)",
  backgroundSize: "100% 1.4rem",
  backgroundPositionY: "0.95rem",
};

// the visual block at the top of every card — a framed panel carrying the
// project's anchor graphic. swap the IconAnchor for a real <Image> here once
// project screenshots exist; the frame stays the same.
function CardVisual({ icon }: { icon: GoodOneIcon }) {
  return (
    <div
      className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[3px] border border-ink/10"
      style={{
        background:
          "linear-gradient(135deg, rgba(124,46,57,0.10), rgba(91,58,41,0.05))",
      }}
    >
      <div className="h-1/2 w-1/2 text-wax">
        <IconAnchor icon={icon} />
      </div>
    </div>
  );
}

// one card, dropped on the desk. the tilt lives on this element and the
// hover straightens it — no scroll math anywhere.
function ScatterCard({
  project,
  rotate,
  className,
}: {
  project: GoodOne;
  rotate: number;
  className?: string;
}) {
  return (
    <motion.article
      className={className}
      variants={cardIn(rotate)}
      whileHover={{ rotate: 0, y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div
        style={linedPaperStyle}
        className="relative w-full rounded-[3px] p-3 pl-5 shadow-[0_10px_22px_-6px_rgba(44,38,32,0.45)] ring-1 ring-black/5 sm:p-4 sm:pl-6"
      >
        {/* margin rule, like a real page of ruled paper */}
        <div
          className="pointer-events-none absolute bottom-3 left-2.5 top-3 w-px bg-wax/25 sm:left-3"
          aria-hidden="true"
        />

        <CardVisual icon={project.icon} />

        <h3 className="mt-2.5 font-display text-base text-ink sm:mt-3 sm:text-lg">
          {project.title}
        </h3>

        <p className="mt-1 font-body text-xs leading-snug text-ink-soft sm:mt-1.5 sm:text-sm sm:leading-relaxed">
          {project.summary}
        </p>

        <ul className="mt-2 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-ink/15 px-2.5 py-0.5 font-body text-[10px] text-ink-soft sm:text-xs"
            >
              {tag}
            </li>
          ))}
        </ul>

        {/* for the one project where the live thing is the proof. */}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-block font-script text-base text-wax underline-offset-2 hover:underline"
          >
            see it live →
          </a>
        )}
      </div>
    </motion.article>
  );
}

export function ProjectsFold() {
  return (
    <section
      id="work"
      className="flex min-h-screen flex-col justify-center bg-paper px-6 py-20"
    >
      <p className="mb-10 text-center font-body text-xs uppercase tracking-[0.25em] text-ink-soft sm:text-sm">
        {EYEBROW}
      </p>

      {/* one set of cards, two layouts. narrow: a plain stack, each card
          keeping its tilt. lg and up: two outer columns of tilted cards with
          the open folder sitting between them. */}
      <motion.div
        className="mx-auto flex w-full max-w-sm flex-col gap-8 lg:grid lg:max-w-[72rem] lg:grid-cols-3 lg:items-start lg:gap-x-8 lg:gap-y-12"
        variants={STAGGER_CONTAINER}
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
      >
        {/* static folder graphic — decoration only, it never moves. */}
        <div className="relative hidden aspect-[1600/1220] w-full -rotate-2 self-center lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:block">
          <Image
            src="/folder.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="24rem"
            className="select-none object-contain [filter:drop-shadow(0_18px_28px_rgba(44,38,32,0.22))]"
          />
        </div>

        {goodOnes.map((project, i) => (
          <ScatterCard
            key={project.id}
            project={project}
            rotate={ROTATIONS[i % ROTATIONS.length]}
            className={`w-full lg:mx-auto lg:max-w-[19rem] ${SPOTS[i % SPOTS.length]}`}
          />
        ))}
      </motion.div>
    </section>
  );
}
