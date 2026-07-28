"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
const WRAPPER_VH = 200;

const CHAPTER_LABELS = ["intro", "maqsad", "fountain"];

// pinned scrollytelling is opt-in: it needs both a wide viewport (two columns
// side by side) and no reduced-motion preference. everything renders stacked
// on the server so hydration matches, then the pin switches on if it applies.
function usePinnedLayout() {
  const shouldReduceMotion = useReducedMotion();
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isWide && !shouldReduceMotion;
}

/* ---------------------------------------------------------------- visuals */

// the intro's polaroid — taped down and slightly off-square. `compact` is the
// board treatment: narrower, so it can share the left column with the taped
// logos as they pile on beside it.
function Polaroid({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative rotate-[-3deg] bg-[#fdfbf3] p-3 pb-10 shadow-[0_14px_30px_-10px_rgba(44,38,32,0.55)] ring-1 ring-black/5 ${
        compact ? "w-64" : "mx-auto w-56 sm:w-64"
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-4 left-1/2 h-7 w-24 -translate-x-1/2 rotate-2 bg-ochre/25"
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
      <span
        className={`absolute bottom-3 left-0 right-0 text-center font-script text-ink-soft ${
          compact ? "text-sm" : "text-lg"
        }`}
      >
        karachi, mostly
      </span>
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

// which chapter is showing, from scroll progress through the wrapper.
function chapterFromProgress(progress: number) {
  if (progress < 1 / 3) return 0;
  if (progress < 2 / 3) return 1;
  return 2;
}

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

// the pinned version: a tall wrapper drives scroll, the inner pane sticks for
// its duration, and the two columns crossfade between chapters. no scroll
// hijacking anywhere — sticky and a progress read, nothing else.
function PinnedChapters() {
  const [active, setActive] = useState(0);
  // +1 when scrolling forward into a later chapter, -1 back into an earlier
  // one. drives which way the copy slides. a ref tracks the current chapter so
  // the direction is computed without a stale closure.
  const [direction, setDirection] = useState(1);
  // false until the pane has risen well into view. drives the heading + first
  // chapter so they reveal *during the approach* and are fully there by the
  // time the pane pins — you catch the animation, and it's never blank on
  // arrival. (gating on scroll progress instead left a dead window at the pin,
  // where the pane is stuck but progress is still ~0.)
  const [started, setStarted] = useState(false);
  const activeRef = useRef(0);
  const ActiveChapter = CHAPTERS[active];
  const wrapperRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  // scroll sets the *target* chapter; a paced stepper (below) walks the active
  // chapter toward it one at a time. that way a fast flick that jumps the
  // progress straight from intro into fountain still shows maqsad in between,
  // instead of the middle chapter never mounting.
  const targetRef = useRef(0);
  const lastStepRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.intersectionRatio >= 0.4)) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: [0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    targetRef.current = chapterFromProgress(v);
  });

  useEffect(() => {
    // minimum time each chapter stays up before the stepper advances, so no
    // chapter is skipped past too fast to register.
    const DWELL_MS = 380;
    let raf = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const cur = activeRef.current;
      const target = targetRef.current;
      if (cur === target) return;
      if (t - lastStepRef.current < DWELL_MS) return;
      const step = target > cur ? 1 : -1;
      const next = cur + step;
      lastStepRef.current = t;
      activeRef.current = next;
      setDirection(step);
      setActive(next);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // jump to a chapter when its dot is clicked: scroll to the point in the tall
  // wrapper whose progress lands mid-chapter. sticky pinning does the rest.
  const goToChapter = (i: number) => {
    const el = wrapperRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const distance = el.offsetHeight - window.innerHeight;
    const progress = (i + 0.5) / CHAPTERS.length;
    window.scrollTo({ top: top + progress * distance, behavior: "smooth" });
  };

  return (
    <div ref={wrapperRef} style={{ height: `${WRAPPER_VH}vh` }}>
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
    <div className="mx-auto max-w-5xl space-y-20 px-6 py-4 sm:space-y-28">
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
  const pinned = usePinnedLayout();

  return (
    <section id="about" className="bg-paper pt-24 pb-12 sm:pt-28 sm:pb-14">
      <div>
        {pinned ? <PinnedChapters /> : <StackedChapters />}
      </div>
    </section>
  );
}
