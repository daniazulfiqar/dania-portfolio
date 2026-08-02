"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  goodOnes,
  NOTE_COLORS,
  noteColorFor,
  type GoodOne,
  type GoodOneCompany,
  type GoodOneIcon,
} from "@/lib/good-ones";
import {
  CaseStudyModal,
  type OpenStudy,
} from "@/components/case-study/case-study-modal";

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
const LEAD = "i've been lucky to have had the chance to work on products that have made a real difference to people's lives!";
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

// the notes sit straight (no tilt). index 0..3 map to the four cards in
// lib/good-ones. kept as an array so a tilt can be reintroduced per-card later.
const ROTATIONS = [0, 0, 0, 0];

// the notes cascade in one at a time as the row scrolls into view. `delayChildren`
// holds the row back until the heading + description have landed; `staggerChildren`
// is the gap between notes (big, so they spring in clearly one after another).
const STAGGER_CONTAINER = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.5, delayChildren: 1.15 } },
};

// each note is hinged at the tape along its top edge (`origin-top`, depth from
// the row's `perspective`) and tips down into place: it starts folded back
// (rotateX -60) and springs to straight (0). a gentler angle than a full flip,
// so it reads as a note settling rather than a big swing.
const cardEntrance = {
  hidden: { opacity: 0, rotateX: -60 },
  shown: {
    opacity: 1,
    rotateX: 0,
    transition: { type: "spring" as const, stiffness: 150, damping: 16 },
  },
};

// reduced-motion: no fold, just a flat fade-in.
const cardEntranceReduced = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.4 } },
};

// the crease: a soft horizontal shadow across the note, opaque while it's folded
// and fading to nothing as it flattens — a fold releasing. rides the same
// hidden/shown variants as the note, so it's in step with the unfold.
const crease = {
  hidden: { opacity: 1 },
  shown: { opacity: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
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

// the student-counsellor's bespoke thumbnail: the round counsellor avatar with
// a little chat bubble beside it. sits in the same aspect-[39/20] frame as the
// other cards' image, on a soft warm wash so the round avatar reads cleanly.
function CounsellorThumbnail() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center gap-2 bg-[url('/images/work/counsellor-bg.png')] bg-cover bg-center px-3">
      <Image
        src="/images/work/counsellor-avatar.png"
        alt="the student counsellor"
        width={726}
        height={726}
        className="h-11 w-11 shrink-0 rounded-full ring-2 ring-white/80 sm:h-12 sm:w-12"
      />
      <span className="relative rounded-xl bg-[#13103D] px-2.5 py-1.5 font-body text-[10px] font-medium leading-snug text-white shadow-[0_4px_10px_-3px_rgba(19,16,61,0.6)] before:absolute before:left-[-5px] before:top-1/2 before:h-0 before:w-0 before:-translate-y-1/2 before:border-y-[6px] before:border-r-[7px] before:border-y-transparent before:border-r-[#13103D] before:content-[''] sm:text-[11px]">
        hi — let&rsquo;s help you ace your exam!
      </span>
    </div>
  );
}

// the acquisition-pipeline's bespoke thumbnail: a little left-to-right flow
// chart of the three-agent system, each stage an emoji chip with a tiny label,
// joined by arrows. lead (whatsapp) → sales agent (chat) → classifier (funnel)
// → campaign analyser (graph). sits in the same aspect-[39/20] image frame.
function PipelineNode({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    // items-start + a fixed-height label so every node's icon sits on the same
    // baseline no matter how many lines the label wraps to.
    <div className="flex w-10 shrink-0 flex-col items-center gap-1 text-center sm:w-11">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-ink/10 sm:h-9 sm:w-9 sm:text-lg">
        {icon}
      </span>
      <span className="font-body text-[7px] leading-tight text-ink/70 sm:text-[8px]">
        {label}
      </span>
    </div>
  );
}

function PipelineThumbnail() {
  // arrows are boxed to the icon's height and centred, so they line up with the
  // icon row even though the nodes below them are top-aligned.
  const arrow = (
    <span
      aria-hidden="true"
      className="flex h-8 shrink-0 items-center text-sm font-bold text-ink/70 sm:h-9 sm:text-base"
    >
      →
    </span>
  );
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center px-2"
      style={{
        backgroundColor: "#f3f5f8",
        backgroundImage:
          "linear-gradient(#e0e5ec 1px, transparent 1px), linear-gradient(90deg, #e0e5ec 1px, transparent 1px)",
        backgroundSize: "13px 13px",
      }}
    >
      {/* inner row is top-aligned so all four icons share a baseline; the outer
          wrapper centres that whole block vertically in the frame. */}
      <div className="flex items-start justify-center gap-0.5">
      <PipelineNode
        icon={
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.6-.1 1.2Z" />
          </svg>
        }
        label="inbound lead"
      />
      {arrow}
      <PipelineNode icon={<span>💬</span>} label="sales agent" />
      {arrow}
      <PipelineNode
        icon={
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#134b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z" />
          </svg>
        }
        label="classifying agent"
      />
      {arrow}
      <PipelineNode icon={<span>📈</span>} label="campaign analyser" />
      </div>
    </div>
  );
}

// each note gets its own light pastel — yellow, pink, blue, green — so the row
// reads as a little wall of sticky notes. text stays ink on all of them. shared
// with the case-study pages via NOTE_COLORS so a card and its page match.
const NOTES = NOTE_COLORS;

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
  onOpen,
}: {
  project: GoodOne;
  rotate: number;
  state: "hovered" | "dimmed" | "rest";
  note: string;
  onEnter: () => void;
  onOpen: () => void;
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
      variants={shouldReduceMotion ? cardEntranceReduced : cardEntrance}
      className="flex w-[70vw] max-w-[16rem] shrink-0 origin-top snap-center sm:w-[15rem] lg:w-auto lg:max-w-none lg:shrink lg:basis-0 lg:grow"
      style={{ zIndex: state === "hovered" ? 10 : 1 }}
    >
      <motion.article
        onMouseEnter={onEnter}
        initial={false}
        animate={target}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="group relative w-full"
      >
        {/* tape strip, same ochre motif as the about-fold scraps */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 left-1/2 z-20 h-6 w-20 -translate-x-1/2 rotate-2 bg-ochre/25"
        />

        {/* the note itself — a flat pastel square. flex-col + h-full so tags sit
            at the bottom and every note matches the tallest in the row. */}
        <div
          className="relative flex h-full flex-col rounded-[3px] p-4 shadow-[0_8px_20px_-14px_rgba(44,38,32,0.32)] ring-1 ring-black/5"
          style={{ backgroundColor: note }}
        >
          {/* crease shadow — opaque while the note is folded, fading out as it
              flattens (skipped for reduced motion). */}
          {!shouldReduceMotion && (
            <motion.div
              aria-hidden="true"
              variants={crease}
              className="pointer-events-none absolute inset-0 z-[15] rounded-[3px] bg-[linear-gradient(to_bottom,rgba(44,38,32,0.28)_0%,rgba(44,38,32,0.06)_38%,rgba(44,38,32,0)_60%)]"
            />
          )}

          {/* stretched button: covers the whole card and opens the case study
              as an in-page pop-up (not a route change). sits above the note but
              below the live-site anchor, which stays independently clickable. */}
          <button
            type="button"
            onClick={onOpen}
            aria-label={`read the case study: ${project.title}`}
            className="absolute inset-0 z-10 rounded-[3px]"
          />

          {/* the project's visual anchor — a real thumbnail when the project
              has one, otherwise the abstract icon in the same frame. */}
          <div className="relative aspect-[39/20] w-full shrink-0 overflow-hidden rounded-[3px] bg-ink/[0.06] ring-1 ring-ink/10">
            {project.thumbnail === "counsellor" ? (
              <CounsellorThumbnail />
            ) : project.thumbnail === "pipeline" ? (
              <PipelineThumbnail />
            ) : project.image ? (
              <Image
                src={project.image}
                alt={`${project.title} thumbnail`}
                fill
                sizes="(min-width: 1024px) 20rem, 70vw"
                className="object-cover"
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-ink/25">
                <div className="h-10 w-10">
                  <IconAnchor icon={project.icon} />
                </div>
              </div>
            )}
          </div>

          {/* the caption gets a fixed min-height (4 lines) so the tag row below
              starts at the same y across all four cards. titles are single-line,
              so they need no reservation — hugging the title keeps the gap to
              the caption tight. */}
          <h3 className="relative mt-3 font-display text-sm font-semibold leading-tight text-ink/85 sm:text-base">
            {project.title}
          </h3>

          <p className="relative mt-1.5 line-clamp-4 min-h-[6.5em] font-body text-xs leading-relaxed text-ink-soft sm:text-sm">
            {project.summary}
          </p>

          {/* tags sit right under the fixed-height caption, so their top edge
              lines up card-to-card. */}
          <ul className="relative flex flex-wrap gap-1.5 pt-3">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-ink/20 px-2 py-0.5 font-body text-[10px] text-ink-soft sm:text-[11px]"
              >
                {tag}
              </li>
            ))}
          </ul>

          {/* bottom row: the read-more cue on the left, the company mark on the
              right. both decorative — the whole card is already the labelled
              link — so the arrow just nudges on hover. */}
          <div className="relative mt-auto flex items-center justify-between gap-2 pt-3">
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-1 font-body text-xs font-medium text-wax"
            >
              read more
              <span className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none">
                →
              </span>
            </span>
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

// the markdown (or null, if still a draft) for each case study, keyed by the
// card id. loaded on the server in app/page.tsx and handed down so a card can
// open its study in-place without a round-trip.
export type StudyContent = Record<string, string | null>;

export function ProjectsFold({ studies }: { studies: StudyContent }) {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  // which case study is open as a pop-up (null = none).
  const [openStudy, setOpenStudy] = useState<OpenStudy | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // build the pop-up payload for a card and open it.
  const openCard = useCallback(
    (project: GoodOne) => {
      setOpenStudy({
        slug: project.id,
        title: project.title,
        summary: project.summary,
        tags: project.tags,
        note: noteColorFor(project.id),
        markdown: studies[project.id] ?? null,
      });
    },
    [studies],
  );

  // a case study can link to another one (a "#cs-<slug>" link in its markdown);
  // resolve the slug to its card and swap the open note to it in place.
  const openStudyBySlug = useCallback(
    (slug: string) => {
      const project = goodOnes.find((p) => p.id === slug);
      if (project) openCard(project);
    },
    [openCard],
  );

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
  // while the notes are still cascading in, the page can't scroll on to the game
  // fold. `lockUntil` is roughly when the last note finishes (heading +
  // description + the staggered spring row).
  const CARDS_MS = 3800;
  const lockUntil = useRef(0);
  const armLock = useCallback(() => {
    lockUntil.current = performance.now() + CARDS_MS;
  }, []);

  useEffect(() => {
    if (inView && !hasRevealed.current) {
      hasRevealed.current = true;
      armLock();
      reveal.start("shown");
    }
  }, [inView, reveal, armLock]);

  useEffect(() => {
    const replayIfWork = () => {
      if (window.location.hash === "#work") {
        // re-hide then re-run, so the arrival animates even after it's already
        // been revealed once by scrolling.
        reveal.set("hidden");
        hasRevealed.current = true;
        armLock();
        requestAnimationFrame(() => reveal.start("shown"));
      }
    };
    window.addEventListener("hashchange", replayIfWork);
    return () => window.removeEventListener("hashchange", replayIfWork);
  }, [reveal, armLock]);

  // hold the page at the work fold until the notes have appeared: while the lock
  // is live, downward scroll is clamped so the next section can't come into view.
  useEffect(() => {
    const clampMax = () => {
      const next = document.getElementById("contact");
      if (!next) return Infinity;
      return next.getBoundingClientRect().top + window.scrollY - window.innerHeight;
    };
    const onWheel = (e: WheelEvent) => {
      if (performance.now() >= lockUntil.current || e.deltaY <= 0) return;
      const max = clampMax();
      if (window.scrollY + e.deltaY >= max) {
        e.preventDefault();
        window.scrollTo(0, Math.min(window.scrollY, max));
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (performance.now() >= lockUntil.current) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (dy <= 0) return;
      const max = clampMax();
      if (window.scrollY >= max) {
        e.preventDefault();
        window.scrollTo(0, max);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);
  // mouse drag-to-scroll. touch and trackpad use the container's native
  // horizontal scroll; only a mouse gets the click-and-drag behaviour. `moved`
  // guards the card links so a drag doesn't fire navigation on release.
  const drag = useRef({
    active: false,
    captured: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollerRef.current;
    if (!el) return;
    // note: we do NOT capture the pointer here. capturing on pointer-down would
    // retarget the eventual `click` to the scroller, so a plain click on a card
    // would never reach the card's button. capture is deferred to onPointerMove,
    // once the pointer has actually moved past the drag threshold.
    drag.current = {
      active: true,
      captured: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const d = drag.current;
    if (!el || !d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) {
      // a real drag has started — now grab the pointer so it keeps scrolling
      // even if it leaves the row, and mark it so the click is suppressed.
      if (!d.captured) {
        el.setPointerCapture(e.pointerId);
        d.captured = true;
      }
      d.moved = true;
      setHovered(null);
    }
    // only scroll once dragging; a still pointer (a click) leaves scroll be.
    if (d.captured) el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current.captured) {
      scrollerRef.current?.releasePointerCapture?.(e.pointerId);
    }
    drag.current.active = false;
    drag.current.captured = false;
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
      className="scroll-mt-24 bg-paper pt-4 pb-20 sm:pt-14 sm:pb-28"
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
          className="flex snap-x snap-mandatory items-stretch gap-4 [perspective:1200px] sm:gap-5"
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
              onOpen={() => openCard(project)}
            />
          ))}
        </motion.ul>
      </div>

      <CaseStudyModal
        study={openStudy}
        onClose={() => setOpenStudy(null)}
        onOpenStudy={openStudyBySlug}
      />
    </section>
  );
}
