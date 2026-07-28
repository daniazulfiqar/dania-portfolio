"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  goodOnes,
  type GoodOne,
  type GoodOneCompany,
  type GoodOneIcon,
} from "@/lib/good-ones";

// the small brand mark tucked into each card's bottom-right corner. `width`/
// `height` are the file's real pixels (so it never upscales); it's drawn small
// via the className height, width auto.
const COMPANY_LOGOS: Record<
  GoodOneCompany,
  { src: string; width: number; height: number }
> = {
  maqsad: { src: "/images/maqsad-logo.png", width: 1594, height: 471 },
  fountain: { src: "/images/fountain-logo.png", width: 471, height: 100 },
};

// heading + the one-line lead-in above the row. voice: lowercase, first person.
const HEADING = "what i've built";
const LEAD = "four case studies: two ai systems i shipped, and two 0-to-1 products i helped build and scaled from scratch.";
const HEADING_WORDS = HEADING.split(" ");

// heading reveal — the title comes in a word at a time (echoing the about
// fold), then the lead line fades up under it once the words have landed.
const HEAD_WORD = {
  hidden: { opacity: 0, y: "0.4em" },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
  },
};

const HEAD_GROUP = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.2, delayChildren: 0.15 } },
};

const LEAD_IN = {
  hidden: { opacity: 0, y: 12 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const, delay: 0.85 },
  },
};

// a baked-in tilt per card so the row reads as hand-placed scraps, never a
// grid. index 0..3 map to the four cards in lib/good-ones.
const ROTATIONS = [-3, 2, -1, 4];

// on load the row staggers its cards in — each fades and rises. the tilt and
// the hover live on an inner node so this entrance never fights them.
// `delayChildren` holds the whole row back until the heading (word-by-word) and
// the description (LEAD_IN, delayed 0.85s + 0.6s) have landed, so the fold
// reveals in order: heading → description → sticky notes.
const STAGGER_CONTAINER = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.1, delayChildren: 1.15 } },
};

const cardEntrance = {
  hidden: { opacity: 0, y: 28 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// small abstract anchors — never a real screenshot, just a simple shape hinting
// at the kind of work (a chart, a trend line, a before/after split, a gauge).
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

// each note gets its own light pastel — yellow, pink, blue, green — so the row
// reads as a little wall of sticky notes. text stays ink on all of them.
const NOTES = ["#fdf3bf", "#fbdce7", "#d9ebf7", "#dcefd4"];

// one sticky-note card. the tilt + the eugenewan-style hover (lift, straighten,
// scale) live on the inner node; the outer <li> owns the entrance + scroll snap.
// every note is the same size — the row stretches them all to the tallest, so
// the longer summaries never make one card bigger than the rest.
function StickyCard({
  project,
  rotate,
  state,
  note,
  onEnter,
}: {
  project: GoodOne;
  rotate: number;
  state: "hovered" | "dimmed" | "rest";
  note: string;
  onEnter: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  const target = shouldReduceMotion
    ? { rotate, scale: 1, y: 0, opacity: 1 }
    : state === "hovered"
      ? { rotate: 0, scale: 1.06, y: -16, opacity: 1 }
      : state === "dimmed"
        ? { rotate, scale: 0.95, y: 0, opacity: 0.5 }
        : { rotate, scale: 1, y: 0, opacity: 1 };

  return (
    <motion.li
      variants={cardEntrance}
      className="flex w-[70vw] max-w-[16rem] shrink-0 snap-center sm:w-[15rem] lg:w-auto lg:max-w-none lg:shrink lg:basis-0 lg:grow"
      style={{ zIndex: state === "hovered" ? 10 : 1 }}
    >
      <motion.article
        onMouseEnter={onEnter}
        initial={false}
        animate={target}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full"
      >
        {/* tape strip, same ochre motif as the about-fold scraps */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 left-1/2 z-20 h-6 w-20 -translate-x-1/2 rotate-2 bg-ochre/25"
        />

        {/* the note itself — a flat pastel square. flex-col + h-full so tags sit
            at the bottom and every note matches the tallest in the row. */}
        <div
          className="relative flex h-full flex-col rounded-[3px] p-4 shadow-[0_16px_34px_-12px_rgba(44,38,32,0.5)] ring-1 ring-black/5"
          style={{ backgroundColor: note }}
        >
          {/* stretched link: covers the whole card without wrapping the inner
              live-site anchor (which would be invalid nested <a>). */}
          <Link
            href={`/work/${project.id}`}
            aria-label={`read the case study: ${project.title}`}
            className="absolute inset-0 z-10 rounded-[3px]"
          />

          {/* image placeholder — the project's visual anchor goes here. swap
              the centred icon for a real <Image> once screenshots exist; the
              frame stays. */}
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[3px] bg-ink/[0.06] ring-1 ring-ink/10">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-ink/25">
              <div className="h-10 w-10">
                <IconAnchor icon={project.icon} />
              </div>
            </div>
          </div>

          <h3 className="relative mt-3 font-display text-base leading-tight text-ink sm:text-lg">
            {project.title}
          </h3>

          <p className="relative mt-1.5 line-clamp-3 font-body text-xs leading-relaxed text-ink-soft sm:text-sm">
            {project.summary}
          </p>

          <div className="relative mt-auto flex items-end justify-between gap-2 pt-3">
            <ul className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-ink/20 px-2 py-0.5 font-body text-[10px] text-ink-soft sm:text-[11px]"
                >
                  {tag}
                </li>
              ))}
            </ul>

            {/* small brand mark in the bottom-right — which business the project
                was for. decorative, so it sits under the stretched link. */}
            <Image
              src={COMPANY_LOGOS[project.company].src}
              alt={`${project.company} logo`}
              width={COMPANY_LOGOS[project.company].width}
              height={COMPANY_LOGOS[project.company].height}
              className="h-3.5 w-auto shrink-0 sm:h-4"
            />
          </div>

          {/* sits above the stretched link so it wins the click. */}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="relative z-20 mt-3 inline-block font-script text-base text-wax underline-offset-2 hover:underline"
            >
              see it live →
            </a>
          )}
        </div>
      </motion.article>
    </motion.li>
  );
}

export function ProjectsFold() {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // the fold's entrance is driven imperatively so it plays exactly when we
  // want and no more: once when it first scrolls into view (and then stays put
  // — scrolling back up never hides or replays it), plus an explicit replay
  // when someone jumps here via the WORK nav link (hash === "#work"). both the
  // heading block and the card row share these controls so they stay in step.
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, {
    once: true,
    margin: "0px 0px -15% 0px",
  });
  const reveal = useAnimationControls();
  const hasRevealed = useRef(false);

  useEffect(() => {
    if (inView && !hasRevealed.current) {
      hasRevealed.current = true;
      reveal.start("shown");
    }
  }, [inView, reveal]);

  useEffect(() => {
    const replayIfWork = () => {
      if (window.location.hash === "#work") {
        // re-hide then re-run, so the arrival animates even after it's already
        // been revealed once by scrolling.
        reveal.set("hidden");
        hasRevealed.current = true;
        requestAnimationFrame(() => reveal.start("shown"));
      }
    };
    window.addEventListener("hashchange", replayIfWork);
    return () => window.removeEventListener("hashchange", replayIfWork);
  }, [reveal]);
  // mouse drag-to-scroll. touch and trackpad use the container's native
  // horizontal scroll; only a mouse gets the click-and-drag behaviour. `moved`
  // guards the card links so a drag doesn't fire navigation on release.
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const d = drag.current;
    if (!el || !d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) {
      d.moved = true;
      setHovered(null);
    }
    el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current.active) {
      scrollerRef.current?.releasePointerCapture?.(e.pointerId);
    }
    drag.current.active = false;
  };

  // capture-phase: if the pointer moved, this was a drag, not a click — cancel
  // the link navigation before it happens.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <section
      ref={sectionRef}
      id="work"
      className="scroll-mt-24 bg-paper pt-10 pb-20 sm:pt-14 sm:pb-28"
    >
      <motion.div
        className="mx-auto max-w-[82rem] px-6"
        initial={shouldReduceMotion ? false : "hidden"}
        animate={reveal}
      >
        <motion.h2
          aria-label={HEADING}
          className="font-heading text-3xl font-semibold leading-tight text-ink sm:text-4xl"
          variants={HEAD_GROUP}
        >
          {HEADING_WORDS.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              aria-hidden="true"
              className="mr-[0.28em] inline-block"
              variants={HEAD_WORD}
            >
              {word}
            </motion.span>
          ))}
        </motion.h2>
        <motion.p
          className="mt-3 max-w-xl font-body text-sm text-ink-soft sm:text-base"
          variants={LEAD_IN}
        >
          {LEAD}
        </motion.p>
      </motion.div>

      {/* the row, centred in the same max-width as the heading so the fold has
          equal left/right margins. on desktop all four cards flex to fit; on
          mobile they keep a fixed width and the row swipes/drags. */}
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="mx-auto mt-10 max-w-[82rem] cursor-grab overflow-x-auto overscroll-x-contain px-6 pb-6 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing lg:cursor-default lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        <motion.ul
          className="flex snap-x snap-mandatory items-stretch gap-4 sm:gap-5"
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate={reveal}
          onMouseLeave={() => setHovered(null)}
        >
          {goodOnes.map((project, i) => (
            <StickyCard
              key={project.id}
              project={project}
              rotate={ROTATIONS[i % ROTATIONS.length]}
              note={NOTES[i % NOTES.length]}
              state={hovered === null ? "rest" : hovered === i ? "hovered" : "dimmed"}
              onEnter={() => !drag.current.active && setHovered(i)}
            />
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
