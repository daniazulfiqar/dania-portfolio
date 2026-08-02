"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

// the closing note. voice matches the rest of the site — lowercase, warm,
// first person. one big heading, then the ways to reach me on a single line,
// and a playful nudge toward the snake game pinned at the very bottom.
const HEADING = "if you are building a product that makes a real difference — let's chat!";
const HEADING_WORDS = HEADING.split(" ");

// heading reveal — a word at a time, the same treatment the about and work
// folds use, so the page ends on a beat it's already established.
const HEAD_WORD = {
  hidden: { opacity: 0, y: "0.4em" },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
  },
};

const HEAD_GROUP = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

// the contact row fades up once the heading has landed.
const ROW = {
  hidden: { opacity: 0, y: 12 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const, delay: 0.5 },
  },
};

// paper-plane flight — tied to scroll. the plane enters off the right edge,
// rides a sine wave across (reaching centre when the fold is centred), and exits
// off the left edge, all scrubbed 1:1 with the section's scroll progress (so it
// reverses when you scroll back up). the path is an explicit sine wave in the
// flight stage's pixel space; the stage spans the full section width, so it is
// rebuilt whenever that width changes (see the ResizeObserver in the component).
// the section's scroll progress (0→1) drives everything off this one curve: the
// plane's position/bank AND the dotted streamer trailing from its tail.
const STAGE_H = 105; // vertical room for the wave; also the gap above the title
const PLANE_W = 112; // small enough that the motion is the star, not the object
const PLANE_H = 77; // 335:231 aspect of plane.svg (cropped to the plane), at PLANE_W
// the plane's tail (rear keel point, 323.6/183.9 in the svg) as a fraction of the
// box — the trail attaches here and the plane pivots here, so a dot always sits
// right at the tail rather than up near the middle.
const TAIL_FX = 0.967;
const TAIL_FY = 0.795;
const REST_Y = 55; // baseline the plane's translateY is measured from (cancels out)
const OVERSHOOT = 180; // how far past each edge the path runs, so it enters/exits fully off-screen
const MID_Y = 55; // centre-line of the sine wave, stage px from the top
const AMP_Y = 30; // wave amplitude — how far it rises/dips from the centre-line
const CYCLES = 1.5; // sine cycles across the whole crossing (crest→trough→crest→trough)
const PHASE = -1.1; // shifts the wave so the plane enters nearer a crest (higher) at the right edge
const BANK = 0.6; // how strongly the plane banks into the curve's tangent
const BANK_MAX = 22; // clamp on the bank angle, degrees
const DOT_SPACING = 15; // approx px between trail dots
const DOT_R = 2; // trail dot radius, px
const DOT_MAX_OP = 0.5; // opacity of a dot right at the plane's tail
const STREAM = 0.26; // length of the trailing streamer, as a fraction of the whole path

const TWO_PI = Math.PI * 2;

type Flight = {
  w: number;
  cx: number;
  dots: { x: number; y: number; t: number }[]; // trail dots + their curve param
};

// the crossing is an explicit sine wave, so it stays curvy the whole way (not
// just one bend). x eases linearly from off the right edge to off the left; y is
// a cosine, so the plane enters at a crest and undulates CYCLES times across.
function flightX(w: number, t: number) {
  return w + OVERSHOOT - t * (w + 2 * OVERSHOOT);
}
function flightY(t: number) {
  return MID_Y - AMP_Y * Math.cos(TWO_PI * CYCLES * t + PHASE);
}
function flightDX(w: number) {
  return -(w + 2 * OVERSHOOT); // constant leftward drift
}
function flightDY(t: number) {
  return AMP_Y * TWO_PI * CYCLES * Math.sin(TWO_PI * CYCLES * t + PHASE);
}

// build the wave for a given stage width: just the trail dots sampled along it
// (the plane's transforms below sample the same functions live).
function buildFlight(w: number): Flight {
  const n = Math.min(220, Math.max(48, Math.round((w + 2 * OVERSHOOT) / DOT_SPACING)));
  const dots = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return { x: flightX(w, t), y: flightY(t), t };
  });
  return { w, cx: w / 2, dots };
}

// the plane's translate offset (curve point relative to the wrapper's baseline
// tail position at cx / REST_Y) and its bank at param t.
function planeX(f: Flight, t: number) {
  return flightX(f.w, t) - f.cx;
}
function planeY(f: Flight, t: number) {
  return flightY(t) - REST_Y;
}
function planeRot(f: Flight, t: number) {
  // bank into the tangent. nose points left at rotate 0, so travelling left is
  // neutral; +180 re-centres the angle there. damped + clamped to a lean.
  let ang = (Math.atan2(flightDY(t), flightDX(f.w)) * 180) / Math.PI + 180;
  ang = (((ang % 360) + 540) % 360) - 180;
  return Math.max(-BANK_MAX, Math.min(BANK_MAX, ang * BANK));
}

// one dot of the trail. it stays invisible until the plane passes its point,
// then it's brightest right at the tail and fades out over a fixed streamer
// length behind the plane — so it reads as a dotted tail that follows, never a
// full-width line. purely a function of scroll progress, so it reverses cleanly.
function TrailDot({
  progress,
  x,
  y,
  t,
}: {
  progress: MotionValue<number>;
  x: number;
  y: number;
  t: number;
}) {
  const opacity = useTransform(progress, (p) => {
    const behind = p - t; // how far the plane has travelled past this dot
    if (behind < 0 || behind > STREAM) return 0; // ahead of the plane, or beyond the tail
    return DOT_MAX_OP * (1 - behind / STREAM);
  });
  return <motion.circle cx={x} cy={y} r={DOT_R} fill="currentColor" style={{ opacity }} />;
}

// each way to reach me. external links (linkedin, resume) carry the little
// arrow and open in a new tab; email + phone stay in-tab via their protocols.
const LINKS: {
  label: string;
  href: string;
  icon: ContactIcon;
  external?: boolean;
}[] = [
  { label: "dania.siddiqui2000@gmail.com", href: "mailto:dania.siddiqui2000@gmail.com", icon: "mail" },
  { label: "+923322344320", href: "tel:+923322344320", icon: "phone" },
  { label: "linkedin", href: "https://linkedin.com/in/daniazulfiqar", icon: "linkedin", external: true },
  { label: "github", href: "https://github.com/daniazulfiqar", icon: "github", external: true },
  { label: "resume", href: "/Dania_Siddiqui_CV.pdf", icon: "resume", external: true },
];

// small line icons, drawn in the same stroke idiom as the project-card anchors
// so they read as part of the same hand. currentColor lets them inherit the
// link's ink→wax hover.
type ContactIcon = "mail" | "phone" | "linkedin" | "github" | "resume";

function Icon({ name }: { name: ContactIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[1.15em] w-[1.15em]",
    "aria-hidden": true,
  };
  switch (name) {
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5 4h3.5l1.6 4-2.2 1.4a11 11 0 0 0 5.7 5.7L15 12.9 19 14.5V18a2 2 0 0 1-2.1 2A14.5 14.5 0 0 1 4 6.9 2 2 0 0 1 5 4z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="7.6" cy="8" r="1.1" fill="currentColor" stroke="none" />
          <path d="M7.6 11v6" />
          <path d="M11.2 17v-6" />
          <path d="M11.2 13.6a2.4 2.4 0 0 1 4.8 0V17" />
        </svg>
      );
    case "github":
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 0 0-2.85 17.54c.45.08.6-.2.6-.43v-1.68c-2.45.53-3-1.09-3-1.09-.4-1.03-.98-1.3-.98-1.3-.8-.55.06-.54.06-.54.89.06 1.36.91 1.36.91.79 1.36 2.07.97 2.58.74.08-.58.31-.97.56-1.2-1.96-.22-4.02-.98-4.02-4.37 0-.97.34-1.75.91-2.37-.09-.22-.4-1.12.09-2.34 0 0 .74-.24 2.43.91a8.4 8.4 0 0 1 4.42 0c1.69-1.15 2.43-.91 2.43-.91.49 1.22.18 2.12.09 2.34.57.62.91 1.4.91 2.37 0 3.4-2.07 4.15-4.04 4.37.32.28.6.82.6 1.65v2.45c0 .23.15.51.6.43A9 9 0 0 0 12 3z" />
        </svg>
      );
    case "resume":
      return (
        <svg {...common}>
          <path d="M6 3h7l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M13 3v5h5" />
          <path d="M8.5 13h7" />
          <path d="M8.5 16.5h4.5" />
        </svg>
      );
  }
}

function ContactLink({
  label,
  href,
  icon,
  external,
}: {
  label: string;
  href: string;
  icon: ContactIcon;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group inline-flex items-center gap-2 rounded-full px-3 py-2 font-body font-medium text-ink-soft transition-colors duration-200 hover:bg-ink/[0.04] hover:text-wax"
    >
      <Icon name={icon} />
      {label}
      {external && (
        <span
          aria-hidden="true"
          className="inline-block text-[0.85em] transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transform-none"
        >
          ↗
        </span>
      )}
    </a>
  );
}

export function ContactFold() {
  const shouldReduceMotion = useReducedMotion();

  // the flight stage spans the full section width, so the S-curve has to be
  // rebuilt whenever that width changes — otherwise the plane wouldn't actually
  // start at the screen edge. measure it, and keep it current on resize.
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200); // sensible SSR default; corrected on mount
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // guard against a 0 measurement (pre-layout / hidden ancestor) collapsing
    // the whole curve to a vertical line — keep the last good width instead.
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const flight = useMemo(() => buildFlight(width), [width]);
  // keep the latest curve in a ref so the plane's transforms always sample the
  // current width without having to recreate the (stable) transforms.
  const flightRef = useRef(flight);
  flightRef.current = flight;

  // shrink the plane on narrow screens (it's too big at mobile widths).
  const planeW = width < 640 ? 72 : PLANE_W;
  const planeH = (planeW * PLANE_H) / PLANE_W;

  // scroll drives everything. `progress` is the section's scroll position: 0 as
  // the fold enters (plane off the right edge), 0.5 when it's centred (plane
  // dead-centre above the title), 1 as it leaves (plane off the left edge). the
  // plane and every trail dot read off this, so it scrubs — and reverses — 1:1.
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const px = useTransform(scrollYProgress, (t) => planeX(flightRef.current, t));
  const py = useTransform(scrollYProgress, (t) => planeY(flightRef.current, t));
  const prot = useTransform(scrollYProgress, (t) => planeRot(flightRef.current, t));

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="flex scroll-mt-24 flex-col items-center overflow-x-clip bg-paper px-6 pb-16 pt-6 sm:px-10 sm:pb-20 sm:pt-36"
    >
      <motion.div
        className="flex w-full flex-col items-center text-center"
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="shown"
        viewport={{ once: true, amount: 0.4 }}
      >
        {/* paper plane, above the heading. the "flight stage" spans the full
            section width so the plane can cross from the very right edge to the
            very left; its measured width drives the S-curve. the SVG viewBox
            tracks that width 1:1, so the trail dots and the plane's transforms
            share one coordinate space. driven by scroll, so it scrubs (and
            reverses) with the page. reduced motion: skip the scrubbed flight +
            trail and just render the plane parked centred above the title. */}
        <motion.div
          ref={stageRef}
          className="relative mb-2 w-full sm:mb-4"
          style={{ height: STAGE_H }}
        >
          {/* dotted streamer — a dot lights up as the plane passes it and fades
              out over a fixed length behind the tail, so it follows the plane. */}
          {!shouldReduceMotion && (
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${width} ${STAGE_H}`}
              fill="none"
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-ink"
            >
              {flight.dots.map((dot, i) => (
                <TrailDot key={i} progress={scrollYProgress} x={dot.x} y={dot.y} t={dot.t} />
              ))}
            </svg>
          )}

          {/* scroll flies the plane along the S (tail on the curve, banking as it
              goes); the inner wrapper adds a slow idle float so it never feels
              frozen when the page is still. */}
          <motion.div
            className="absolute left-1/2"
            style={{
              top: REST_Y,
              width: planeW,
              height: planeH,
              // anchor + pivot at the tail so the trail meets the tail, not the middle
              marginLeft: -planeW * TAIL_FX,
              marginTop: -planeH * TAIL_FY,
              transformOrigin: `${(planeW * TAIL_FX).toFixed(1)}px ${(planeH * TAIL_FY).toFixed(1)}px`,
              ...(shouldReduceMotion ? {} : { x: px, y: py, rotate: prot }),
            }}
          >
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/images/plane.svg"
                alt=""
                aria-hidden="true"
                width={335}
                height={231}
                unoptimized
                className="h-auto w-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.h2
          aria-label={HEADING}
          className="max-w-2xl font-heading text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-[2.75rem] md:leading-tight"
          variants={HEAD_GROUP}
        >
          {HEADING_WORDS.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              aria-hidden="true"
              className="mr-[0.25em] inline-block"
              variants={HEAD_WORD}
            >
              {word}
            </motion.span>
          ))}
        </motion.h2>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm sm:mt-10 sm:text-base"
          variants={ROW}
        >
          {LINKS.map((link) => (
            <ContactLink key={link.label} {...link} />
          ))}
        </motion.div>
      </motion.div>

      {/* the playful nudge toward the snake game, pinned to the very bottom of
          the fold. the whole thing is a link to #snake, so the arrow both
          invites and does the scrolling. handwritten script + a gently bouncing
          chevron, so it reads as an aside rather than another CTA. */}
      <motion.a
        href="#snake"
        className="group mt-32 flex flex-col items-center gap-2 px-6 text-center sm:mt-44 sm:w-fit sm:max-w-none"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <span className="max-w-[16rem] whitespace-normal font-body text-xs italic text-ink/40 transition-colors duration-200 group-hover:text-wax sm:max-w-none sm:whitespace-nowrap sm:text-sm">
          or scroll down if you want a break from the day and play the snake game
        </span>
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-ink/40 transition-colors duration-200 group-hover:text-wax"
          animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.a>
    </section>
  );
}
