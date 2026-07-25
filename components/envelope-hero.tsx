"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const ENVELOPE_SRC = "/images/envelope/envelope-open.png";
const PHOTO_SRC = "/dania.png";

const ENVELOPE_SIZES =
  "(min-width: 1536px) 66rem, (min-width: 1280px) 58rem, (min-width: 1024px) 50rem, (min-width: 768px) 34rem, (min-width: 640px) 26rem, 20rem";

// the shape of the envelope's FRONT pocket panel, as a fraction of the
// artwork. we paint a second, clipped copy of the same envelope image on
// top of the note/photo using this polygon — so the note/photo genuinely
// sit *inside* the pocket (occluded by the front panel) rather than resting
// on top of the artwork. their tops peek above this panel's V-shaped edge;
// scrolling slides them up out of it, scrolling back tucks them in again.
const POCKET_CLIP = "polygon(4% 46%, 50% 68%, 96% 46%, 99% 98%, 1% 98%)";

export function EnvelopeHero() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

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
  const photoBottom = useTransform(scrollYProgress, [0, 0.6], ["22%", "60%"]);
  const photoRight = useTransform(scrollYProgress, [0.15, 0.6], ["20%", "9%"]);
  const photoRotate = useTransform(scrollYProgress, [0, 0.6], [8, -6]);

  // ...then the note follows just a beat behind (they come out together, so
  // the reveal stays short), rising up AND sliding out to the left.
  const noteBottom = useTransform(scrollYProgress, [0.12, 0.65], ["21%", "54%"]);
  const noteLeft = useTransform(scrollYProgress, [0.22, 0.65], ["20%", "9%"]);
  const noteRotate = useTransform(scrollYProgress, [0.12, 0.65], [5, -2]);

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

  const photoStyle = shouldReduceMotion
    ? { zIndex: 10, right: "9%", bottom: "58%", rotate: -6 }
    : { zIndex: 10, right: photoRight, bottom: photoBottom, rotate: photoRotate };

  const noteStyle = shouldReduceMotion
    ? { zIndex: 20, left: "9%", bottom: "52%", rotate: -2 }
    : { zIndex: 20, left: noteLeft, bottom: noteBottom, rotate: noteRotate };

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
        <div className="relative flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-[1.75rem] border border-ink/10 px-6 pb-3 shadow-sm sm:pb-5">
          {/* dreamy dusk-sky backdrop behind the envelope. a soft wash over it
              keeps it airy (openwhen-style) and, together with the bottom fade
              into the paper colour, lets the envelope sit in the scene rather
              than on a hard photo edge. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <Image
              src="/hero-bg.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_89%] [filter:saturate(1.5)_contrast(1.14)_brightness(0.96)]"
            />
            {/* scroll-driven wash: strong at the top, clears to nothing as
                you scroll, so the photo develops into its real colours. */}
            <motion.div
              className="absolute inset-0 bg-paper"
              style={{ opacity: shouldReduceMotion ? 0 : bgWash }}
            />
          </div>

          <motion.div
          className="relative mx-auto w-full max-w-[17rem] sm:max-w-[22rem] md:max-w-[29rem] lg:max-w-[min(76vh,48rem)] xl:max-w-[min(78vh,56rem)] 2xl:max-w-[min(80vh,66rem)]"
          style={
            shouldReduceMotion
              ? undefined
              : { y: envelopeY, scale: envelopeScale, rotate: envelopeRotate }
          }
        >
          <div className="relative w-full" style={{ aspectRatio: "5424 / 5240" }}>
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

            {/* photo — tucked in the pocket, comes out first, on the right */}
            <motion.div
              className="absolute w-[26%] rounded-[3px] bg-white p-2 shadow-xl sm:p-3"
              style={photoStyle}
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
              className="absolute w-[46%] rounded-[2px] pb-4 pl-[2.25rem] pr-4 pt-[1.3rem] text-left shadow-2xl leading-[1.3rem] sm:pb-5 sm:pl-[2.6rem] sm:pr-5 sm:pt-[1.55rem] sm:leading-[1.55rem] lg:pb-6 lg:pl-[3.1rem] lg:pr-7 lg:pt-[1.75rem] lg:leading-[1.75rem] [background-position-y:1rem] [background-size:100%_1.3rem] sm:[background-position-y:1.2rem] sm:[background-size:100%_1.55rem] lg:[background-position-y:1.37rem] lg:[background-size:100%_1.75rem]"
              style={{
                ...noteStyle,
                backgroundColor: "#fdfbf3",
                backgroundImage:
                  "linear-gradient(rgba(91,58,41,0.16) 1px, transparent 1px)",
              }}
            >
              {/* margin rule, like a real page of ruled paper */}
              <div
                className="pointer-events-none absolute bottom-2 left-6 top-2 w-px bg-wax/25 sm:left-7 lg:left-9"
                aria-hidden="true"
              />
              {/* every line-height below equals the ruled-line spacing, and
                  gaps between blocks are whole lines — so the text sits on the
                  rules (baseline grid) instead of the rules cutting through it. */}
              <h1 className="relative font-display text-sm italic text-ink sm:text-lg lg:text-xl">
                hi, i&rsquo;m dania. i solve problems.. only if there is a nice
                meal ahead
              </h1>
              <p className="relative mt-[1.3rem] font-body text-[0.7rem] text-ink-soft sm:mt-[1.55rem] sm:text-xs lg:mt-[1.75rem] lg:text-sm">
                just like i get obsessed with making a nice meal, i take my
                problem solving very seriously — the thinking, the process,
                every one ends in a win, or a lesson i carry into the next. this
                place is where i keep the good ones.
              </p>
              <p className="relative mt-[1.3rem] text-right font-script text-sm text-wax sm:mt-[1.55rem] sm:text-lg lg:mt-[1.75rem] lg:text-xl">
                come have a look —
              </p>
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
          </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
