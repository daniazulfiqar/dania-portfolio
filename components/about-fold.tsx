"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

// the section's heading. sits at the top of the right-hand column, above the
// copy, and stays put while the chapters turn over beneath it. reveals a word
// at a time when it first scrolls in — self-contained (explicit whileInView) so
// it animates the same whether it's inside a stagger container or not.
const HEADING_WORDS = ["A", "bit", "about", "me"];

// `started` is only passed by the pinned layout: there the heading lives inside
// a sticky pane that's already on screen while the section scrolls up, so
// whileInView would fire during the approach and be over before you arrive.
// instead the pin drives `started` (true once you've actually scrolled into the
// pin) and the heading reveals then. the stacked layout leaves it undefined and
// falls back to whileInView.
function AboutHeading({ started }: { started?: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const controlled = started !== undefined;
  const revealProps = controlled
    ? { animate: started ? "show" : "hidden" }
    : { whileInView: "show", viewport: { once: true, amount: 0.6 } as const };
  return (
    <motion.h2
      aria-label="A bit about me"
      className="mb-7 font-heading text-3xl font-semibold leading-none text-ink sm:text-4xl"
      initial={shouldReduceMotion ? false : "hidden"}
      {...revealProps}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.2, delayChildren: 0.15 } },
      }}
    >
      {HEADING_WORDS.map((word, i) => (
        <motion.span
          key={word}
          aria-hidden="true"
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: "0.4em" },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
            },
          }}
        >
          {word}
          {i < HEADING_WORDS.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.h2>
  );
}

// the scroll driver's height. one viewport per chapter, roughly — tune here.
// kept just above 3× a viewport's worth of pin travel so each chapter gets a
// comfortable dwell without a long dead-scroll tail after the last one resolves
// (that tail was the bulk of the gap before the projects fold).
// the scroll-lock root is a little taller than one screen. the pane pins for
// that whole height; while it's pinned we capture the scroll and step chapters
// instead of moving the page. the extra height past 100vh is the runway the
// page scrolls through once you've passed the last chapter (or before the
// first) — kept generous enough that even a fast flick lands inside the pinned
// zone and gets caught rather than skipping past.
const ROOT_VH = 140;

// the phone version is scroll-linked (not scroll-captured): the pane pins and
// the scroll position picks the chapter. this is the total scroll runway; minus
// the one pinned screen it leaves ~1.4 screens split across the three chapters,
// so each is a roughly half-screen swipe to the next.
const MOBILE_ROOT_VH = 240;

const CHAPTER_LABELS = ["intro", "maqsad", "fountain"];

// pinned scrollytelling is opt-in: it needs both a wide viewport (two columns
// side by side) and no reduced-motion preference. everything renders stacked
// on the server so hydration matches, then the pin switches on if it applies.
// three layouts: the desktop pinned scrollytelling (>=1024), the phone
// scroll-linked version (<1024), and a stacked fallback for reduced-motion. the
// server renders `stacked` (width 0) so hydration matches, then the client
// switches to the right one.
function useAboutMode(): "desktop" | "mobile" | "stacked" {
  const shouldReduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const sync = () => setWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (shouldReduceMotion || width === 0) return "stacked";
  return width >= 1024 ? "desktop" : "mobile";
}

/* ---------------------------------------------------------------- visuals */

// the intro's polaroid — taped down and slightly off-square. `compact` is the
// board treatment: narrower, so it can share the left column with the taped
// logos as they pile on beside it.
function Polaroid({
  compact = false,
  mini = false,
}: {
  compact?: boolean;
  mini?: boolean;
}) {
  // `mini` is the phone treatment: a small taped square that shares a compact
  // board row with the logos.
  const size = mini ? "w-28" : compact ? "w-64" : "mx-auto w-56 sm:w-64";
  const pad = mini ? "p-2 pb-6" : "p-3 pb-10";
  return (
    <div
      className={`relative rotate-[-3deg] bg-[#fdfbf3] ${pad} shadow-[0_14px_30px_-10px_rgba(44,38,32,0.55)] ring-1 ring-black/5 ${size}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1/2 -translate-x-1/2 rotate-2 bg-ochre/25 ${
          mini ? "-top-3 h-5 w-16" : "-top-4 h-7 w-24"
        }`}
      />
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src="/dania.png"
          alt="dania"
          fill
          sizes="(min-width: 640px) 16rem, 14rem"
          className="object-cover"
        />
      </div>
    </div>
  );
}

// a company's logo, taped onto the page beside its heading. `width`/`height`
// are the file's real pixels; `display` is how wide it's drawn — kept near or
// below the file's own width so nothing upscales into mush.
type Logo = {
  name: string;
  src: string;
  width: number;
  height: number;
  display: number;
};

function TapedLogo({
  logo,
  rotate,
  display = logo.display,
}: {
  logo: Logo;
  rotate: number;
  display?: number;
}) {
  return (
    <span
      className="relative inline-block shrink-0 rounded-[2px] border border-ink/10 bg-[#fdfbf3] px-5 py-3 shadow-[0_10px_22px_-10px_rgba(44,38,32,0.5)]"
      style={{ rotate: `${rotate}deg` }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3 bg-ochre/25"
      />
      <Image
        src={logo.src}
        alt={logo.name}
        width={logo.width}
        height={logo.height}
        style={{ width: display, height: "auto" }}
        className="max-w-full"
      />
    </span>
  );
}

const MAQSAD_LOGO: Logo = {
  name: "maqsad",
  src: "/images/maqsad-logo.png",
  width: 1594,
  height: 471,
  // drawn well under the file's own width, so it stays crisp. sized to sit at
  // about the same optical height as the fountain mark beside it.
  display: 150,
};

const FOUNTAIN_LOGO: Logo = {
  name: "fountain",
  src: "/images/fountain-logo.png",
  width: 471,
  height: 100,
  display: 180,
};

/* ------------------------------------------------------------------- copy */

// highlighter swipe — the yellow draws itself on left→right via the `.marker`
// css animation (see globals.css). css owns the draw because framer won't
// interpolate background-size. we start it only when the phrase scrolls into
// view (adding `.marker--draw`), so the draw is actually seen — otherwise the
// pinned intro would finish drawing at page load, before you scroll to it.
function Mark({ children, order = 0 }: { children: ReactNode; order?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || drawn) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [drawn]);

  return (
    <mark
      ref={ref}
      className={`marker${drawn ? " marker--draw" : ""}`}
      // stagger the draw by reading order within the chapter, so the phrases
      // highlight one after another. the base offset holds even the first one
      // back until the chapter's text has finished sliding in — otherwise it
      // draws during the transition and reads as already-highlighted.
      style={{ animationDelay: `${0.8 + order * 1.5}s` }}
    >
      {children}
    </mark>
  );
}

function IntroText() {
  return (
    <div className="space-y-5">
      <motion.p
        variants={paraItem}
        className="font-body text-base leading-relaxed text-ink sm:text-base sm:leading-relaxed"
      >
        I was born and raised in Karachi, Pakistan. i completed my A levels from
        The Lyceum School and did my bachelor&apos;s in business administration
        from <Mark order={0}>IBA Karachi</Mark> with a major in data analytics. I am
        someone who loved
        being around numbers and math was always favourite for me!
      </motion.p>
      <motion.p
        variants={paraItem}
        className="font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed"
      >
        I am currently a <Mark order={1}>lead product manager</Mark>, and over the past 5
        years i have worked across building B2C and B2B digital products for
        students, educators, institutions, and industrial manufacturers. lately
        i&apos;ve incorporated the use of agents into almost all the execution
        and building work i do (the brain is still used for original thinking!)
      </motion.p>
      <motion.p
        variants={paraItem}
        className="font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed"
      >
        i love working with a <Mark order={2}>motivated team</Mark> who genuinely
        wants to do good work and have a good time doing it!
      </motion.p>
    </div>
  );
}

// the taped logo now lives on the left board, so the copy just leads with the
// company name (in english) and the one-line context for anyone who's never
// heard of it.
function ChapterText({
  name,
  context,
  children,
}: {
  name: string;
  context: string;
  children: ReactNode;
}) {
  return (
    <div>
      <motion.p variants={paraItem} className="font-body text-ink">
        <span className="text-lg font-semibold text-wax sm:text-xl">{name}</span>
        <span className="text-sm italic text-ink-soft sm:text-base">
          {" ("}
          {context}
          {")"}
        </span>
      </motion.p>
      {children}
    </div>
  );
}

function MaqsadText() {
  return (
    <ChapterText
      name="Maqsad"
      context="Pakistan's largest ed-tech platform by scale and funding"
    >
      <motion.p variants={paraItem} className="mt-7 font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed">
        i own the{" "}
        <Mark order={0}>mobile app, web app, and internal tools</Mark> the
        business runs on, and have scaled all three. i started here as an intern,
        and have grown into a lead PM role
        where i manage the tech team (designers, engineers, data analysts) and
        extend my
        input to the marketing and socials team (whatever&apos;s needed to help
        the product land!)
      </motion.p>
      <motion.p variants={paraItem} className="mt-5 font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed">
        at Maqsad i have built across both <Mark order={1}>b2c and b2b products</Mark>, the
        full user
        journey from onboarding through payments to retention, plus the ai
        systems and agents running underneath.
      </motion.p>
      <motion.p variants={paraItem} className="mt-5 font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed">
        as an ed-tech we think of features as building blocks we put together
        depending on the segment we are operating in. the main constant is the
        goal to{" "}
        <Mark order={2}>
          hand-hold a student from before they enroll to the point they achieve
          their desired grade/admission
        </Mark>
        . a student knows maqsad has them covered, and that&apos;s the brand the
        product has built over the last 4 years.
      </motion.p>
    </ChapterText>
  );
}

function FountainText() {
  return (
    <ChapterText
      name="Fountain"
      context="industrial water pump and compressor business"
    >
      <motion.p variants={paraItem} className="mt-7 font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed">
        this was a <Mark order={0}>personal project</Mark> for my dad&apos;s very
        traditional small-scale company. the company had been around for nearly
        30 years
        with both b2b and b2c customers but no digital presence.
      </motion.p>
      <motion.p variants={paraItem} className="mt-5 font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed">
        when my dad complained about not getting enough b2b orders due to lack
        of trust, and him not having enough resources to hire a designer or
        engineer, i{" "}
        <Mark order={1}>built him his very own e-commerce website from scratch</Mark> with
        technical seo for visibility (thanks to claude code i am a builder now!)
      </motion.p>
      <motion.p variants={paraItem} className="mt-5 font-body text-base leading-relaxed text-ink-soft sm:text-base sm:leading-relaxed">
        my goal was to give an old-school industrial business the same product
        discovery experience you&apos;d expect from modern e-commerce, to{" "}
        <Mark order={2}>build trust</Mark> with larger scale b2b companies who were
        previously hesitant to
        trust the product (my dad is super happy now, yay!)
      </motion.p>
    </ChapterText>
  );
}

// the three chapters, in order. index 0/1/2 throughout. the photo isn't in
// here — it stays on the left across all three; what changes is this copy,
// and from chapter 2 on it carries its own taped logo.
const CHAPTERS = [IntroText, MaqsadText, FountainText];

/* ----------------------------------------------------------------- layout */

// the chapter block only translates (no opacity of its own) — its paragraphs
// carry the fade, staggering in under it. direction comes from scroll: moving
// forward, the block enters from below and leaves upward; scrolling back, it
// reverses. `custom` is the scroll direction (+1 down, -1 up).
const chapterContainer = {
  enter: (dir: number) => ({ y: dir >= 0 ? 26 : -26 }),
  center: {
    y: 0,
    transition: {
      when: "beforeChildren" as const,
      staggerChildren: 0.22,
      delayChildren: 0.15,
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
  exit: (dir: number) => ({
    y: dir >= 0 ? -22 : 22,
    transition: { duration: 0.26, ease: [0.33, 1, 0.68, 1] as const },
  }),
};

// each paragraph (and the company line) rides these — same variant NAMES as the
// container, so they follow its enter/center/exit and stagger on the way in.
const paraItem = {
  enter: { opacity: 0, y: 14 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22 } },
};

// the stacked/mobile fallback wraps each chapter in this so the same paragraph
// items stagger in when the chapter scrolls into view (no direction there).
const stackContainer = {
  enter: {},
  center: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

// the left board: the polaroid starts alone and centered; as you scroll into
// each company's chapter its taped logo lands beside the others and everything
// slides over to make room. nothing stacks on top of anything — they sit side
// by side, tilted, like pinned scraps. `layout` tweens the shuffle; the fade is
// just opacity so it doesn't fight the layout transform.
const BOARD_SPRING = { type: "spring", stiffness: 240, damping: 28 } as const;

function BoardScrap({
  keyName,
  className,
  children,
}: {
  keyName: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={keyName}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ ...BOARD_SPRING, opacity: { duration: 0.35 } }}
      className={className}
    >
      {/* a springy "drop" on the inner element, kept off the layout node so the
          two transforms don't collide: it falls in, over-rotates, and settles —
          like a scrap being tossed onto the board. lifts on hover like the
          polaroid. */}
      <motion.div
        initial={{ scale: 0.72, y: -40, rotate: -14, opacity: 0 }}
        animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
        whileHover={{ y: -6, scale: 1.05 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 12,
          opacity: { duration: 0.2 },
        }}
        className="cursor-pointer"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ScrapboardStack({ active }: { active: number }) {
  return (
    <div className="flex h-[32rem] w-full items-center justify-center gap-8">
      <motion.div
        layout
        transition={BOARD_SPRING}
        whileHover={{ y: -6, scale: 1.03 }}
        className="cursor-pointer"
      >
        <Polaroid compact />
      </motion.div>

      {/* the tapes stack in a column beside the polaroid — maqsad sits up top,
          fountain lands below it. lifted a touch so the pair reads high. */}
      <div className="relative -mt-10 flex flex-col items-start gap-6">
        <AnimatePresence mode="popLayout">
          {active >= 1 && (
            <BoardScrap keyName="maqsad">
              <TapedLogo logo={MAQSAD_LOGO} rotate={3} display={120} />
            </BoardScrap>
          )}
          {active >= 2 && (
            <BoardScrap keyName="fountain" className="ml-6">
              <TapedLogo logo={FOUNTAIN_LOGO} rotate={-4} display={130} />
            </BoardScrap>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// the pinned version: the root is a bit taller than one screen and the pane
// sticks for its full height. while the pane is pinned we *capture* the scroll —
// each gesture (a flick, a wheel notch, a swipe) steps exactly one chapter
// instead of moving the page. only once you're at the last chapter going down,
// or the first going up, does the page scroll on. so a fast flick can neither
// skip the middle chapter nor blow straight past to the next section.
function PinnedChapters() {
  const [active, setActive] = useState(0);
  // +1 when moving into a later chapter, -1 back into an earlier one. drives
  // which way the copy slides. a ref mirrors it so handlers read it fresh.
  const [direction, setDirection] = useState(1);
  const [started, setStarted] = useState(false);
  const activeRef = useRef(0);
  // when the current chapter arrived — its copy staggers in over ~1.4s from
  // here, and the lock won't advance (or release) until that has elapsed, so a
  // chapter is always fully readable before you can move off it.
  const arrivedAtRef = useRef(0);
  const ActiveChapter = CHAPTERS[active];
  const rootRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  const go = useCallback((next: number, dir: number) => {
    activeRef.current = next;
    arrivedAtRef.current = performance.now();
    setDirection(dir);
    setActive(next);
    setStarted(true);
  }, []);

  // reveal the heading + first chapter as the pane rises into view, so it's
  // never blank on arrival.
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.intersectionRatio >= 0.4)) {
          setStarted(true);
          // intro reveals during the approach; start its readable-timer now so
          // you're not made to wait again once the pane locks.
          arrivedAtRef.current = performance.now();
          io.disconnect();
        }
      },
      { threshold: [0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the scroll lock. `pinned()` is true while the root fully covers the viewport
  // (the pane is stuck at the top). in that window every wheel/touch is HELD
  // (the page can't move) unless you're already at the end you're scrolling
  // toward — so the page can never reach the next section until you've stepped
  // through every chapter. chapters advance on a fixed cooldown, so neither a
  // slow drag nor a hard flick can run through more than one every STEP_COOLDOWN.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const last = CHAPTERS.length - 1;
    // how long a chapter's copy takes to finish staggering in. the lock won't
    // advance to the next chapter — or release to the next section at the ends —
    // until the current chapter has been on screen at least this long.
    const REVEAL_MS = 2000;

    // the page position at which the pane is pinned. captured when we first
    // lock; while holding we snap back to it every event, which undoes any
    // inertial scroll that slipped past preventDefault (a hard trackpad flick).
    let lockY: number | null = null;

    // returns true if the input should be captured (page held). when it returns
    // false the caller lets the event through so the page scrolls on.
    const consume = (dir: number) => {
      const r = root.getBoundingClientRect();
      const isPinned = r.top <= 1 && r.bottom >= window.innerHeight - 1;
      if (!isPinned) {
        lockY = null;
        return false;
      }
      if (lockY === null) lockY = window.scrollY + r.top; // lock this position
      const cur = activeRef.current;
      const revealed = performance.now() - arrivedAtRef.current >= REVEAL_MS;
      // at the edge in the travel direction: release only once this chapter has
      // fully revealed; until then, hold so its content isn't cut short.
      if ((dir > 0 && cur >= last) || (dir < 0 && cur <= 0)) {
        if (revealed) {
          lockY = null;
          return false;
        }
        return true;
      }
      // otherwise advance — but only after the current chapter has finished
      // appearing. either way, hold the page.
      if (revealed) go(cur + dir, dir);
      return true;
    };

    // hold: block the event AND re-assert the locked scroll position, so
    // momentum can't creep the page toward the next section.
    const hold = (prevent: () => void) => {
      prevent();
      if (lockY !== null) window.scrollTo(0, lockY);
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      if (consume(e.deltaY > 0 ? 1 : -1)) hold(() => e.preventDefault());
    };

    let touchStartY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY == null) return;
      const dy = touchStartY - (e.touches[0]?.clientY ?? touchStartY);
      if (Math.abs(dy) < 6) return;
      // reset the anchor each step so one swipe reads as one continuous gesture
      touchStartY = e.touches[0]?.clientY ?? null;
      if (consume(dy > 0 ? 1 : -1)) hold(() => e.preventDefault());
    };
    const onTouchEnd = () => {
      touchStartY = null;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [go]);

  // arriving via the ABOUT nav link should always start on the intro chapter.
  useEffect(() => {
    const reset = () => {
      if (window.location.hash === "#about") {
        activeRef.current = 0;
        setDirection(1);
        setActive(0);
      }
    };
    window.addEventListener("hashchange", reset);
    return () => window.removeEventListener("hashchange", reset);
  }, []);

  // dots just switch chapters in place — no scrolling needed, the pane is pinned.
  const goToChapter = (i: number) => {
    if (i === activeRef.current) return;
    go(i, i > activeRef.current ? 1 : -1);
  };

  return (
    <div ref={rootRef} style={{ height: `${ROOT_VH}vh` }}>
      <div ref={paneRef} className="sticky top-0 flex h-screen items-center overflow-hidden px-6 pt-[4.75rem]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,32rem)_1fr] items-center gap-8">
          {/* left: the scrapboard. polaroid first, then each company's taped
              logo slides in beside it as you scroll into its chapter. */}
          <ScrapboardStack active={active} />

          {/* right: the heading, fixed at the top, and under it the copy for
              this chapter, crossfading in place. */}
          <div className="flex h-[32rem] flex-col justify-center">
            <AboutHeading started={started} />
            <div className="relative flex-1">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={active}
                  custom={direction}
                  className="absolute inset-0 flex flex-col justify-start"
                  variants={chapterContainer}
                  initial="enter"
                  // the first chapter holds at "enter" until you've scrolled in,
                  // then reveals; later chapters animate on mount as usual.
                  animate={started ? "center" : "enter"}
                  exit="exit"
                >
                  <ActiveChapter />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* which chapter you're in — and a way to jump there. the wax fill is a
            single shared element that morphs between dots as the active one
            changes (layoutId), instead of three fills flicking on and off. */}
        <ul className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-4">
          {CHAPTER_LABELS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => goToChapter(i)}
                aria-label={`go to ${label}`}
                aria-current={i === active ? "true" : undefined}
                className="relative block h-2.5 w-2.5 rounded-full bg-ink/20 transition-transform hover:scale-125"
              >
                {i === active && (
                  <motion.span
                    layoutId="about-dot"
                    className="absolute inset-0 rounded-full bg-wax"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// the phone board: a small polaroid with the taped logos landing beside it as
// the chapters advance — the same idea as the desktop scrapboard, sized down to
// sit above the copy in a single column.
function MobileBoard({ active }: { active: number }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <motion.div layout transition={BOARD_SPRING} className="cursor-pointer">
        <Polaroid mini />
      </motion.div>
      <div className="relative flex flex-col items-start gap-3">
        <AnimatePresence mode="popLayout">
          {active >= 1 && (
            <BoardScrap keyName="maqsad">
              <TapedLogo logo={MAQSAD_LOGO} rotate={3} display={90} />
            </BoardScrap>
          )}
          {active >= 2 && (
            <BoardScrap keyName="fountain" className="ml-4">
              <TapedLogo logo={FOUNTAIN_LOGO} rotate={-4} display={100} />
            </BoardScrap>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// the phone version of the pinned scrollytelling. same three chapters, but
// scroll-LINKED rather than scroll-captured: the pane pins for MOBILE_ROOT_VH
// and the scroll position (not a captured gesture) picks the chapter, so it
// feels like native scrolling — the copy swipes and each logo tapes on beside
// the polaroid as you pass its band, then the page releases to the next section.
function MobileChapters() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const activeRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end end"],
  });

  // three even bands across the pinned scroll pick the active chapter. a small
  // gap between the switch points keeps a chapter from flickering when you hover
  // right on a boundary.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = v >= 0.6 ? 2 : v >= 0.3 ? 1 : 0;
    if (idx !== activeRef.current) {
      setDirection(idx > activeRef.current ? 1 : -1);
      activeRef.current = idx;
      setActive(idx);
    }
  });

  const ActiveChapter = CHAPTERS[active];

  return (
    <div ref={rootRef} style={{ height: `${MOBILE_ROOT_VH}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-6 pb-8 pt-[5.5rem]">
        <MobileBoard active={active} />

        {/* heading, then the chapter copy swiping in place under it. the type is
            tightened here (smaller heading + body) for the phone via variant
            overrides, so the shared chapter components stay untouched. */}
        <div className="mt-6 [&_h2]:mb-4 [&_h2]:text-2xl">
          <AboutHeading />
        </div>
        {/* the copy swipes as one block (fade + horizontal slide) keyed off the
            active chapter — direction comes from scroll. done at the block level
            rather than per-paragraph so it reliably reveals on a phone (the
            desktop per-line stagger relies on variant broadcasting that doesn't
            re-fire cleanly here). `overflow-hidden` keeps the slide off-canvas
            from widening the page. */}
        <div className="relative flex-1 overflow-hidden [&_.mt-5]:mt-3 [&_.mt-7]:mt-3 [&_p]:text-[13px] [&_p]:leading-[1.55]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={active}
              // scrollable so a long chapter (maqsad) can be read in full on a
              // short screen; when its scroll hits the end, the gesture chains to
              // the page and advances to the next chapter. `pb-6` gives the last
              // line breathing room above the dots.
              className="absolute inset-0 flex flex-col justify-start overflow-y-auto pb-6"
              initial={{ opacity: 0, x: direction >= 0 ? 36 : -36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -36 : 36 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <ActiveChapter />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* which chapter you're in — indicators only (the scroll drives it). */}
        <ul className="mt-4 flex justify-center gap-2.5">
          {CHAPTER_LABELS.map((label, i) => (
            <li key={label}>
              <span
                aria-hidden="true"
                className={`block h-2 w-2 rounded-full transition-colors ${
                  i === active ? "bg-wax" : "bg-ink/20"
                }`}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// the fallback, and what the server always renders: the same three chapters
// stacked in normal flow, each fading and rising in once as it scrolls into
// view. no pin, no progress tracking.
function StackedChapters() {
  const shouldReduceMotion = useReducedMotion();

  // each chapter is a stagger container: its paragraph items (the shared
  // motion.p) rise in one after another as the chapter scrolls into view — the
  // same reveal as the pinned version, minus the pin and the direction.
  const container = {
    variants: stackContainer,
    initial: shouldReduceMotion ? false : ("enter" as const),
    whileInView: "center" as const,
    viewport: { once: true, margin: "-80px" },
  };

  return (
    <div className="mx-auto max-w-5xl space-y-20 px-6 pb-4 pt-24 sm:space-y-28 sm:pt-28">
      {/* the photo leads, then the chapters follow under it */}
      <motion.div
        className="grid items-center gap-10 md:grid-cols-[minmax(0,17rem)_1fr] md:gap-14"
        {...container}
      >
        <Polaroid />
        <div>
          <AboutHeading />
          <IntroText />
        </div>
      </motion.div>

      <motion.div {...container}>
        <MaqsadText />
      </motion.div>

      <motion.div {...container}>
        <FountainText />
      </motion.div>
    </div>
  );
}

export function AboutFold() {
  const mode = useAboutMode();

  return (
    <section id="about" className="bg-paper pb-12 sm:pb-14">
      <div>
        {mode === "desktop" && <PinnedChapters />}
        {mode === "mobile" && <MobileChapters />}
        {mode === "stacked" && <StackedChapters />}
      </div>
    </section>
  );
}
