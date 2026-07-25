"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { goodOnes, type GoodOne, type GoodOneIcon } from "@/lib/good-ones";

// how much scroll the pinned section eats, in viewports: one to arrive, then
// SCROLL_PER_CARD per card, then a beat of settle room at the end before the
// section releases and normal scrolling resumes.
const SCROLL_PER_CARD_VH = 60;
const SETTLE_VH = 40;

// each card emerges over its own window of the section's scroll progress,
// staggered with a slight overlap so they come out one after another.
const CARD_STAGGER = 0.21;
const CARD_DURATION = 0.26;
const FIRST_CARD_START = 0.05;

// within a card's window: the first RISE_FRACTION is spent climbing straight
// up out of the folder's mouth, the rest is the toss out to its landing spot.
const RISE_FRACTION = 0.45;

// the folder's box inside the stage, as % of the stage. horizontally
// centered; sized so there's real estate on all four sides for the cards to
// land in.
const FOLDER_LEFT_PCT = 30;
const FOLDER_WIDTH_PCT = 40;
const FOLDER_TOP_PCT = 27;
// folder height in stage % = width% * stageAspect * (1220/1600); with the
// stage locked to 16/10 below this works out to ~49%.
const FOLDER_HEIGHT_PCT = FOLDER_WIDTH_PCT * (16 / 10) * (1220 / 1600);

// where a card sits while still tucked in the folder (hidden). the flap's top
// edge sits ~23% down the folder box — START top is below that line so the
// card begins fully hidden inside the folder's mouth before it springs out.
const MOUTH_LEFT_PCT = 37;
const START_TOP_PCT = 46;
const RISEN_TOP_PCT = 2;

// final scattered landing spots — one per card, corners around the folder,
// each at its own slight tilt, none covering the folder's mouth or its tab
// (top-left). tuned for up to 4 cards; extras (if content grows) reuse slots.
const LANDING_SPOTS = [
  { left: 2, top: 6, rotate: -5 }, // top-left
  { left: 71, top: 6, rotate: 4.5 }, // top-right
  { left: 70, top: 54, rotate: -3.5 }, // bottom-right
  { left: 3, top: 54, rotate: 3.5 }, // bottom-left
];

// the shape of the folder's FRONT flap panel, as a fraction of the folder
// box — same trick as the envelope's POCKET_CLIP: a clipped copy of the
// same folder image painted above the cards, so a card still inside reads
// as genuinely behind the flap rather than pasted over the illustration.
const FRONT_FLAP_CLIP =
  "polygon(0% 23%, 75% 23%, 93% 95%, 87% 100%, 10% 100%, 0% 97%)";

// small abstract anchors — never a real screenshot, just a simple shape
// hinting at the kind of work (a chart, a trend line, a before/after split,
// a gauge). placeholder projects cycle through these; real projects can
// pick whichever reads truest once content lands.
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

// the prominent visual block at the top of every card — a framed panel
// carrying the project's anchor graphic large enough to actually read as an
// image, roughly 40% of the card's height. swap the IconAnchor for a real
// <Image> here once project screenshots exist; the frame stays the same.
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

function CardBody({
  project,
  onOpen,
}: {
  project: GoodOne;
  onOpen: (project: GoodOne) => void;
}) {
  return (
    <article
      style={linedPaperStyle}
      className="relative w-full rounded-[3px] p-3 pl-5 shadow-[0_10px_22px_-6px_rgba(44,38,32,0.45)] ring-1 ring-black/5 sm:p-4 sm:pl-6"
    >
      {/* margin rule, like a real page of ruled paper */}
      <div
        className="pointer-events-none absolute bottom-3 left-2.5 top-3 w-px bg-wax/25 sm:left-3"
        aria-hidden="true"
      />

      <CardVisual icon={project.icon} />

      <h3 className="mt-2.5 font-display text-sm text-ink sm:mt-3 sm:text-lg">
        {project.title}
      </h3>

      <p className="mt-1 font-body text-[11px] leading-snug text-ink-soft sm:mt-1.5 sm:text-sm sm:leading-relaxed">
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

      <button
        type="button"
        onClick={() => onOpen(project)}
        className="mt-2.5 font-script text-sm text-wax underline-offset-2 hover:underline sm:text-base"
      >
        read more →
      </button>
    </article>
  );
}

// the scroll progress at which each card's emergence starts. staggered so the
// cards come out one after another as you scroll down.
function cardStart(index: number) {
  return FIRST_CARD_START + index * CARD_STAGGER;
}

// one project card, its emergence SCROLL-SCRUBBED: as `progress` advances
// across the card's window it RISES straight up out of the folder's mouth,
// then arcs over to its scattered landing spot — so you literally watch it
// climb out of the folder as you scroll. `progress` here is a ONE-WAY
// (monotonic) copy of scroll: it tracks scrolling down but holds when you
// scroll back up, so the card scrubs out and then never rewinds into the
// folder.
function ScatterCard({
  project,
  index,
  progress,
  reduceMotion,
  onOpen,
}: {
  project: GoodOne;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
  onOpen: (project: GoodOne) => void;
}) {
  const spot = LANDING_SPOTS[index % LANDING_SPOTS.length];
  const start = cardStart(index);
  const riseEnd = start + CARD_DURATION * RISE_FRACTION;
  const end = start + CARD_DURATION;

  // rise phase: straight up out of the mouth. toss phase: over to the spot.
  const left = useTransform(
    progress,
    [start, riseEnd, end],
    [`${MOUTH_LEFT_PCT}%`, `${MOUTH_LEFT_PCT}%`, `${spot.left}%`],
  );
  const top = useTransform(
    progress,
    [start, riseEnd, end],
    [`${START_TOP_PCT}%`, `${RISEN_TOP_PCT}%`, `${spot.top}%`],
  );
  const rotate = useTransform(
    progress,
    [start, riseEnd, end],
    [0, spot.rotate * 0.4, spot.rotate],
  );
  const opacity = useTransform(progress, [start - 0.02, start], [0, 1]);
  // behind the front flap (z 30) while rising so it reads as coming from
  // inside the folder; above it once risen so a landed card is never clipped.
  const zIndex = useTransform(progress, (v) => (v >= riseEnd ? 40 : 20));

  const wrapClass =
    "absolute w-[52%] max-w-[19rem] sm:w-[28%] sm:max-w-[17rem]";

  if (reduceMotion) {
    return (
      <div
        className={wrapClass}
        style={{
          left: `${spot.left}%`,
          top: `${spot.top}%`,
          rotate: `${spot.rotate}deg`,
          zIndex: 40,
        }}
      >
        <CardBody project={project} onOpen={onOpen} />
      </div>
    );
  }

  return (
    <motion.div
      className={wrapClass}
      style={{ left, top, rotate, opacity, zIndex }}
    >
      <CardBody project={project} onOpen={onOpen} />
    </motion.div>
  );
}

// full write-up overlay, opened from a card's "read more". closes on the
// backdrop, the ✕, or Escape.
function DetailModal({
  project,
  onClose,
}: {
  project: GoodOne | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={project.title}
            style={linedPaperStyle}
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[4px] p-6 pl-8 shadow-2xl ring-1 ring-black/10 sm:p-8 sm:pl-10"
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div
              className="pointer-events-none absolute bottom-5 left-4 top-5 w-px bg-wax/25 sm:left-6"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="absolute right-4 top-3 font-body text-lg text-ink-soft hover:text-ink"
            >
              ✕
            </button>

            <div className="mx-auto mb-5 w-2/3 sm:w-1/2">
              <CardVisual icon={project.icon} />
            </div>

            <h3 className="font-display text-xl text-ink sm:text-2xl">
              {project.title}
            </h3>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-ink/15 px-2.5 py-0.5 font-body text-xs text-ink-soft"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft sm:text-base">
              {project.detail}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GoodOnesFolder() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [openProject, setOpenProject] = useState<GoodOne | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // a ONE-WAY (monotonic) copy of scroll progress — it tracks scrolling down
  // but never decreases when you scroll back up. the cards scrub off this
  // instead of raw scroll, so their come-out-of-the-folder animation plays
  // forward as you scroll down and simply HOLDS when you scroll up: nothing
  // ever rewinds back into the folder. (a MotionValue, not React state, so it
  // drives the cards' transforms every frame without re-rendering.)
  const revealed = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > revealed.get()) revealed.set(v);
  });
  // seed from the current scroll position too (e.g. a refresh partway down).
  useEffect(() => {
    const v = scrollYProgress.get();
    if (v > revealed.get()) revealed.set(v);
  }, [revealed, scrollYProgress]);

  const total = goodOnes.length;
  const sectionHeightVh = 100 + total * SCROLL_PER_CARD_VH + SETTLE_VH;

  // the folder's box, shared by the back artwork and the clipped front-flap
  // copy so they stay pixel-aligned.
  const folderBoxStyle: CSSProperties = {
    left: `${FOLDER_LEFT_PCT}%`,
    top: `${FOLDER_TOP_PCT}%`,
    width: `${FOLDER_WIDTH_PCT}%`,
    height: `${FOLDER_HEIGHT_PCT}%`,
  };

  return (
    <section
      ref={sectionRef}
      className="relative bg-paper"
      style={{ height: `${sectionHeightVh}vh` }}
    >
      {/* pinned stage: sticks in the viewport while scroll drives the cards
          out of the folder one by one; once all have landed, the section's
          remaining height runs out and the page scrolls on naturally. */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-4">
        <div
          className="relative w-full max-w-[64rem]"
          style={{ aspectRatio: "16 / 10" }}
        >
          {/* folder artwork, back layer — cards climb up from behind this,
              occluded below the flap's edge by the clipped copy of the same
              image painted on top (FRONT_FLAP_CLIP, below the cards in this
              file but above them in z). */}
          <div className="absolute" style={{ ...folderBoxStyle, zIndex: 10 }}>
            <Image
              src="/folder.png"
              alt=""
              aria-hidden="true"
              fill
              priority={false}
              className="pointer-events-none select-none object-contain [filter:drop-shadow(0_18px_28px_rgba(44,38,32,0.25))]"
            />
          </div>

          {goodOnes.map((project, index) => (
            <ScatterCard
              key={project.id}
              project={project}
              index={index}
              progress={revealed}
              reduceMotion={!!shouldReduceMotion}
              onOpen={setOpenProject}
            />
          ))}

          {/* folder artwork, front layer — a clipped copy of the very same
              image, aligned pixel-for-pixel over the back layer. painted
              above the cards (z 30 > 20) so a card still inside the folder
              is genuinely occluded below the flap's edge and reads as
              emerging from behind it, exactly like the envelope's pocket. */}
          <div
            className="pointer-events-none absolute"
            style={{ ...folderBoxStyle, zIndex: 30 }}
          >
            <Image
              src="/folder.png"
              alt=""
              aria-hidden="true"
              fill
              className="select-none object-contain"
              style={{ clipPath: FRONT_FLAP_CLIP }}
            />
          </div>

          {/* "the good ones" tab — a small labelled tab attached to the
              folder. sits ABOVE every card (z 40 > cards' 20 and the flap's
              30) so a card rising past it slides behind the tab and the
              label stays readable the entire time, never covered. */}
          <div
            className="pointer-events-none absolute -rotate-2"
            style={{
              left: `${FOLDER_LEFT_PCT + FOLDER_WIDTH_PCT * 0.04}%`,
              top: `${FOLDER_TOP_PCT - 3.5}%`,
              zIndex: 50,
            }}
            aria-hidden="true"
          >
            <span
              className="inline-block whitespace-nowrap rounded-t-md border border-b-0 border-ink/10 px-3 py-1 font-script text-base text-ink-soft shadow-sm sm:text-lg"
              style={{ backgroundColor: "#e8c48a" }}
            >
              the good ones
            </span>
          </div>
        </div>
      </div>

      <DetailModal project={openProject} onClose={() => setOpenProject(null)} />
    </section>
  );
}
