"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const ENVELOPE_SRC = "/images/envelope/envelope-open.png";
const PHOTO_SRC = "/dania.png";
// the crowned claude mascot that pops out of the pocket alongside the note +
// photo. intrinsic 1064×1176.
const CLAUDE_SRC = "/images/claude_icon.png";
// the light bulb that pops out of the pocket on the LEFT — mirror of the
// claude mascot on the right. intrinsic 642×807.
const BULB_SRC = "/images/light-bulb.svg";

const ENVELOPE_SIZES =
  "(min-width: 1536px) 66rem, (min-width: 1280px) 58rem, (min-width: 1024px) 50rem, (min-width: 768px) 34rem, (min-width: 640px) 26rem, 20rem";

// the shape of the envelope's FRONT pocket panel, as a fraction of the
// artwork. we paint a second, clipped copy of the same envelope image on
// top of the note/photo using this polygon — so the note/photo genuinely
// sit *inside* the pocket (occluded by the front panel) rather than resting
// on top of the artwork. their tops peek above this panel's V-shaped edge;
// scrolling slides them up out of it, scrolling back tucks them in again.
const POCKET_CLIP = "polygon(4% 46%, 50% 68%, 96% 46%, 99% 98%, 1% 98%)";

// the note's copy. the heading always shows; the body only fits inside the
// pocket at lg and up, so on smaller screens it moves into an overlay.
const NOTE_HEADING = "hi, i'm dania - senior product manager + builder";

const NOTE_POINTS = [
  "problem solving",
  "using agents to execute almost everything",
  "building products that actually sell",
  "and making sure it looks (pretty) good while doing it all",
];

// sizing for the note's own type. inside the envelope the lg sizes are in
// cqw so the note scales with the artwork; the overlay isn't inside that
// container, so it gets plain rem sizes instead.
const NOTE_H1_CLASS =
  "font-display text-[2.8cqw]/[3.9cqw] text-ink sm:text-[3.2cqw]/[4.2cqw] lg:text-[max(12px,2.3cqw)]/[3.15cqw]";
const NOTE_TEXT_IN_POCKET =
  "font-body text-[2.15cqw]/[3.9cqw] text-ink-soft sm:text-[2.3cqw]/[4.2cqw] lg:text-[max(10px,1.62cqw)]/[3.15cqw]";
const NOTE_GAP_IN_POCKET = "mt-[3.9cqw] sm:mt-[4.2cqw] lg:mt-[3.15cqw]";

function NoteBody({
  textClass = NOTE_TEXT_IN_POCKET,
  gapClass = NOTE_GAP_IN_POCKET,
}: {
  textClass?: string;
  gapClass?: string;
}) {
  return (
    <>
      <p className={`relative ${gapClass} ${textClass}`}>
        my work sits at the intersection of
      </p>
      {/* the list keeps the same line rhythm as everything else, so the
          numbered lines land on the rules too. */}
      <ol className={`relative list-inside list-decimal ${textClass}`}>
        {NOTE_POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ol>
      <p className={`relative ${gapClass} ${textClass}`}>
        and of course, all of this is done much better when there&rsquo;s a
        nice meal ahead ✌️
      </p>
    </>
  );
}

// the full note, as an overlay. only ever opened from the small-screen
// "read more" — closes on the backdrop, the ✕, or escape.
function NoteOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
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
            aria-label="hi, i'm dania"
            className="relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-[3px] p-6 pl-9 leading-[1.6rem] shadow-2xl ring-1 ring-black/10 [background-position-y:1.15rem] [background-size:100%_1.6rem]"
            style={{
              backgroundColor: "#fdfbf3",
              backgroundImage:
                "linear-gradient(rgba(91,58,41,0.16) 1px, transparent 1px)",
            }}
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* the same margin rule as the note it came out of */}
            <div
              className="pointer-events-none absolute bottom-4 left-6 top-4 w-px bg-wax/25"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="absolute right-4 top-3 font-body text-lg leading-none text-ink-soft hover:text-ink"
            >
              ✕
            </button>

            <p className="relative font-display text-base text-ink">
              {NOTE_HEADING}
            </p>

            <NoteBody
              textClass="font-body text-sm text-ink-soft"
              gapClass="mt-[1.6rem]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EnvelopeHero() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [noteOpen, setNoteOpen] = useState(false);

  // the hero's rest positions + scroll choreography differ on phones (below lg):
  // the note peeks higher, the claude sits nearer centre, the items eject over
  // almost the whole pinned scroll, and the envelope itself stays put instead of
  // drifting — so on a phone you scroll the items fully out of a held envelope
  // before the page moves on. desktop keeps its original feel.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // one control drives both the "peek" hint and the hover invite: the note
  // lifts a few px out of the pocket. on load it does it once, unprompted, so
  // you know the note comes out; hovering the envelope repeats it on demand.
  const [lift, setLift] = useState(false);
  useEffect(() => {
    if (shouldReduceMotion) return;
    const up = window.setTimeout(() => setLift(true), 750);
    const down = window.setTimeout(() => setLift(false), 1600);
    return () => {
      window.clearTimeout(up);
      window.clearTimeout(down);
    };
  }, [shouldReduceMotion]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // "start start" -> "end end": progress 0 at the very top of the page,
    // progress 1 exactly when the (200vh) section's bottom reaches the
    // viewport's bottom — which, since this is the whole page, is also
    // exactly the max amount you can scroll. So the entire scrollable
    // distance on the page maps 1:1 to the envelope opening. Read directly
    // (not ratcheted) so scrolling back up slides the note/photo back into
    // the pocket, exactly like pushing them back in.
    offset: ["start start", "end end"],
  });

  // the photo comes out of the pocket first, on the right. at rest its
  // bottom sits low inside the pocket so only its top edge peeks above the
  // front panel; scrolling raises it up and out. note both items are kept
  // *within* the pocket's width so their sides are always occluded — only
  // their tops ever peek above the panel edge.
  // the photo comes out first, on the right. it rises up AND slides out to
  // the right so it clears the note instead of stacking over it. the sideways
  // slide is held back until it's begun rising (so its side stays hidden in
  // the pocket at rest, then it fans out once it's above the panel edge).
  // on mobile the emergence finishes later in the scroll (0.85 vs 0.6) so the
  // items keep rising for almost the whole pinned scroll instead of popping out
  // in the first third and then sitting through dead scroll.
  const photoEnd = isMobile ? 0.85 : 0.6;
  const noteEnd = isMobile ? 0.9 : 0.65;
  const photoBottom = useTransform(scrollYProgress, [0, photoEnd], ["22%", "60%"]);
  const photoRight = useTransform(scrollYProgress, [0.15, photoEnd], ["20%", "9%"]);
  const photoRotate = useTransform(scrollYProgress, [0, photoEnd], [8, -6]);

  // ...then the note follows just a beat behind (they come out together, so
  // the reveal stays short), rising up AND sliding out to the left.
  // rest position sits the note low in the pocket so only its heading clears
  // the front panel's V-edge before you scroll; scrolling raises it fully out.
  // the note rests higher on mobile ("18%" vs "10%") so its heading peeks above
  // the pocket at rest, the way the polaroid's corner does.
  const noteBottom = useTransform(scrollYProgress, [0.12, noteEnd], [isMobile ? "18%" : "10%", "54%"]);
  const noteLeft = useTransform(scrollYProgress, [0.22, noteEnd], ["20%", "9%"]);
  const noteRotate = useTransform(scrollYProgress, [0.12, noteEnd], [5, -2]);

  // the crowned claude mascot: tucked deep in the pocket at rest (hidden behind
  // the front panel), then — once the photo has begun emerging — it rises up and
  // settles just ABOVE the photo. right is offset from photoRight so its centre
  // lines up over the photo.
  // tracks just ABOVE the photo the whole way (photoBottom + ~31% photo height),
  // so it never crosses over the polaroid; right is offset from photoRight to
  // centre over it.
  // rest bottom (18%) is deliberately low: at this element's width/rest
  // x-span, its entire box sits below POCKET_CLIP's V-line, so the real
  // front pocket panel (z-30) genuinely covers it — same mechanism as the
  // photo/note, no opacity or clip-path fakery needed. it only starts rising
  // once the photo is already moving (0.05, vs. the photo's 0), so it reads
  // as following the photo out rather than appearing on its own.
  // claude sits nearer the centre on mobile (larger `right` = further from the
  // right edge) so it doesn't crowd the right side of the frame.
  const claudeBottom = useTransform(scrollYProgress, [0.05, photoEnd], ["18%", "91%"]);
  const claudeRight = useTransform(scrollYProgress, [0.18, photoEnd], [isMobile ? "40%" : "28%", isMobile ? "26%" : "21%"]);

  // the light bulb: mirror of the claude mascot but on the LEFT side. same
  // rise timing so the two rise together, one off each shoulder of the note.
  const bulbBottom = useTransform(scrollYProgress, [0.05, photoEnd], ["18%", isMobile ? "87%" : "92%"]);
  const bulbLeft = useTransform(scrollYProgress, [0.18, photoEnd], [isMobile ? "40%" : "20%", isMobile ? "26%" : "2%"]);

  // the whole envelope drifts up a touch and eases forward as you scroll, so
  // the scene feels alive rather than frozen while the note/photo come out.
  const envelopeY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const envelopeScale = useTransform(scrollYProgress, [0, 1], [1, 1.03]);
  const envelopeRotate = useTransform(scrollYProgress, [0, 1], [0, -1]);

  // the sky starts washed out (a paper overlay) and clears to its real colours
  // as you scroll the first fold — the photo "develops" while the note comes
  // out of the envelope. driven off raw scroll so it's fully reversible: scroll
  // back up and, as the note/photo tuck back into the envelope, the wash
  // returns in step with them.
  const bgWash = useTransform(scrollYProgress, [0, 1], [0.45, 0]);

  // parallax: the sky drifts down slower than the envelope rises, so the pocket
  // gains depth as the note leaves it. the bg is over-scanned (inset -6%) so
  // this drift never exposes a paper gap at the edges.
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 48]);

  // the "scroll" hint disappears the moment you start moving — and stays gone.
  // driven by a one-way flag (not raw scroll) so scrolling back up doesn't
  // bring it back.
  const [hasScrolled, setHasScrolled] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > 0.01) setHasScrolled(true);
  });

  const photoStyle = shouldReduceMotion
    ? { zIndex: 10, right: "9%", bottom: "58%", rotate: -6 }
    : { zIndex: 10, right: photoRight, bottom: photoBottom, rotate: photoRotate };

  const noteStyle = shouldReduceMotion
    ? { zIndex: 20, left: "9%", bottom: "52%", rotate: -2 }
    : { zIndex: 20, left: noteLeft, bottom: noteBottom, rotate: noteRotate };

  // positioned by `right` so it tracks above the photo. z 25 sits above the
  // note/photo (z 10/20); it clears the front panel since it rides high.
  const claudeStyle = shouldReduceMotion
    ? { zIndex: 25, right: "16%", bottom: "84%", rotate: 0 }
    : { zIndex: 25, right: claudeRight, bottom: claudeBottom, rotate: 0 };

  const bulbStyle = shouldReduceMotion
    ? { zIndex: 25, left: "3%", bottom: "88%", rotate: 0 }
    : { zIndex: 25, left: bulbLeft, bottom: bulbBottom, rotate: 0 };

  return (
    // this section is taller than the viewport on purpose: the extra height
    // below is the "scroll the first fold" distance that drives the opening.
    // the actual envelope visual is pinned (sticky) so it stays put in the
    // centre-bottom of the screen while that scroll distance is consumed.
    <section ref={sectionRef} className="relative h-[200vh] bg-paper">
      {/* the sticky viewport holds a single rounded, bordered "card" inset
          from the page edges (openwhen-style), sitting just below the fixed
          nav. everything — sky backdrop, envelope, note — lives inside it. */}
      <div className="sticky top-0 h-screen p-3 pt-[4.75rem] sm:p-4 sm:pt-[4.75rem]">
        <div className="relative flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-[1.75rem] border border-ink/10 px-2 pb-[14vh] shadow-sm sm:px-6 sm:pb-[8vh] lg:pb-5">
          {/* dreamy dusk-sky backdrop behind the envelope. a soft wash over it
              keeps it airy (openwhen-style) and, together with the bottom fade
              into the paper colour, lets the envelope sit in the scene rather
              than on a hard photo edge. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <motion.div
              className="absolute inset-[-6%]"
              style={shouldReduceMotion ? undefined : { y: bgY }}
            >
              <Image
                src="/hero-bg.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="origin-bottom scale-[1.4] object-cover object-[center_96%] [filter:saturate(1.5)_contrast(1.14)_brightness(0.96)] lg:scale-100"
              />
            </motion.div>
            {/* scroll-driven wash: strong at the top, clears to nothing as
                you scroll, so the photo develops into its real colours. */}
            <motion.div
              className="absolute inset-0 bg-paper"
              style={{ opacity: shouldReduceMotion ? 0 : bgWash }}
            />
          </div>

          {/* load-in: the whole envelope fades and rises into place on first
              paint, so the fold arrives rather than just being there. */}
          <motion.div
            className="w-full"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          >
          <motion.div
          className="relative mx-auto w-full max-w-[23rem] sm:max-w-[26rem] md:max-w-[29rem] lg:max-w-[min(76vh,48rem)] xl:max-w-[min(78vh,56rem)] 2xl:max-w-[min(80vh,66rem)]"
          style={
            shouldReduceMotion || isMobile
              ? undefined
              : { y: envelopeY, scale: envelopeScale, rotate: envelopeRotate }
          }
        >
          {/* a container, so the note inside can size itself off the
              envelope's actual width (cqw) rather than off breakpoints. from
              lg up the envelope is capped by viewport HEIGHT (min(76vh,48rem)),
              so on a short window it shrinks while breakpoint-fixed type would
              not — which is what made the note swell to fill the frame. */}
          <div
            className="@container relative w-full"
            style={{ aspectRatio: "5424 / 5240" }}
          >
            {/* envelope artwork (back layer) — the flap, lining and pocket
                back. the note/photo are painted above this (z 10/20)... */}
            <Image
              src={ENVELOPE_SRC}
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes={ENVELOPE_SIZES}
              className="object-contain"
              style={{ zIndex: 0 }}
            />

            {/* photo — tucked in the pocket, comes out first, on the right.
                hovering it pops it further out; moving away tucks it back. */}
            <motion.div
              className="absolute w-[26%] cursor-pointer rounded-[3px] bg-white p-2 shadow-xl sm:p-3"
              style={photoStyle}
              whileHover={shouldReduceMotion ? undefined : { y: -16 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              aria-hidden="true"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[1px] bg-ink/5">
                <Image
                  src={PHOTO_SRC}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1280px) 20rem, (min-width: 768px) 14rem, 8rem"
                  className="object-cover"
                />
              </div>
            </motion.div>

            {/* note — the real hero copy, tucked in the pocket, rises up
                second on the left, styled like a real sheet of ruled paper */}
            <motion.div
              className="absolute w-[54%] cursor-pointer rounded-[2px] pb-[3.2cqw] pl-[5.8cqw] pr-[3.2cqw] pt-[3.9cqw] text-left leading-[3.9cqw] shadow-2xl [background-position-y:3.05cqw] [background-size:100%_3.9cqw] sm:w-[60%] sm:pb-[3.6cqw] sm:pl-[6.4cqw] sm:pr-[3.6cqw] sm:pt-[4.2cqw] sm:leading-[4.2cqw] sm:[background-position-y:3.3cqw] sm:[background-size:100%_4.2cqw] lg:w-[52%] lg:pb-[2.7cqw] lg:pl-[5.6cqw] lg:pr-[3.1cqw] lg:pt-[3.15cqw] lg:leading-[3.15cqw] lg:[background-position-y:2.45cqw] lg:[background-size:100%_3.15cqw]"
              style={{
                ...noteStyle,
                backgroundColor: "#fdfbf3",
                backgroundImage:
                  "linear-gradient(rgba(91,58,41,0.16) 1px, transparent 1px)",
                // the note's own rest rotation swings its bottom-left corner
                // past the envelope's edges; trim it off so it never shows
                // past the pocket.
                clipPath: "inset(0 0 5% 1.5%)",
              }}
              // load peek (a one-time hint the note comes out), then hover pops
              // it further out and moving away tucks it back.
              animate={shouldReduceMotion ? undefined : { y: lift ? -12 : 0 }}
              whileHover={shouldReduceMotion ? undefined : { y: -18 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              {/* margin rule, like a real page of ruled paper */}
              <div
                className="pointer-events-none absolute bottom-2 left-[4.3cqw] top-2 w-px bg-wax/25 sm:left-[4.6cqw] lg:left-[4.1cqw]"
                aria-hidden="true"
              />
              {/* every line-height below equals the ruled-line spacing, and
                  gaps between blocks are whole lines — so the text sits on the
                  rules (baseline grid) instead of the rules cutting through it. */}
              <h1 className={`relative ${NOTE_H1_CLASS}`}>{NOTE_HEADING}</h1>

              {/* the rest of the note only fits in the pocket on a wide
                  screen. below lg it's a "read more" that opens the same copy
                  in an overlay, so the envelope illusion survives on a phone
                  instead of the note towering over it. */}
              <div className="hidden lg:block">
                <NoteBody />
              </div>

              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="relative mt-[3.9cqw] font-script text-[2.8cqw] text-wax underline-offset-2 hover:underline sm:mt-[4.2cqw] sm:text-[3.2cqw] lg:hidden"
              >
                read more →
              </button>
            </motion.div>

            {/* the crowned claude mascot — tucked inside the pocket at rest,
                rising partway out on scroll, below the note + photo. */}
            <motion.div
              className="absolute w-[11%] cursor-pointer lg:w-[9.5%]"
              style={claudeStyle}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              aria-hidden="true"
            >
              <div className="relative aspect-[1064/1176] w-full drop-shadow-[0_6px_12px_rgba(44,38,32,0.3)]">
                <Image
                  src={CLAUDE_SRC}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1024px) 9rem, 5rem"
                  className="object-contain"
                />
              </div>
            </motion.div>

            {/* the light bulb — mirror of the claude mascot on the LEFT,
                tucked inside the pocket at rest, rising partway out on scroll. */}
            <motion.div
              className="absolute w-[11%] cursor-pointer"
              style={bulbStyle}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              aria-hidden="true"
            >
              <div className="relative aspect-[642/807] w-full drop-shadow-[0_6px_12px_rgba(44,38,32,0.3)]">
                <Image
                  src={BULB_SRC}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1024px) 9rem, 5rem"
                  className="object-contain"
                />
              </div>
            </motion.div>

            {/* envelope FRONT pocket panel (top layer) — a clipped copy of
                the very same artwork, perfectly aligned over the back layer.
                because it's painted above the note/photo (z 30 > 20/10) it
                occludes their lower half, so they read as being *inside* the
                pocket. only what rises above its V-edge is ever visible. */}
            <Image
              src={ENVELOPE_SRC}
              alt=""
              aria-hidden="true"
              fill
              sizes={ENVELOPE_SIZES}
              className="pointer-events-none object-contain"
              style={{ zIndex: 30, clipPath: POCKET_CLIP }}
            />

            {/* scroll hint — sits on the envelope near its bottom, bobs
                gently, and fades away the moment you start scrolling. */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-[12%] z-40 flex flex-col items-center gap-1 text-paper/90 [text-shadow:0_1px_2px_rgba(43,33,24,0.35)]"
              animate={{ opacity: hasScrolled ? 0 : 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              aria-hidden="true"
            >
              <span className="font-script text-xs">scroll</span>
              <motion.span
                animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
                transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
                className="text-xs leading-none"
              >
                ↓
              </motion.span>
            </motion.div>
          </div>
          </motion.div>
          </motion.div>
        </div>
      </div>

      <NoteOverlay open={noteOpen} onClose={() => setNoteOpen(false)} />
    </section>
  );
}
