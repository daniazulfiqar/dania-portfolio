"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";

type Section = { id: string; text: string };

// the site's ivory + burgundy system — no per-section colour coding.
const FLAG_ACTIVE_BG = "#7c2e39"; // wax / burgundy
const FLAG_ACTIVE_TEXT = "#f4efe4"; // paper / ivory
const FLAG_IDLE_BG = "#efe7d7"; // faint ivory
const FLAG_IDLE_TEXT = "#7c2e39"; // burgundy

// the in-note table of contents. on wide screens it's a rail of index tabs cut
// into the note's right edge — the active tab (the section you're scrolled to)
// pulls out in wax, and clicking a tab jumps there. when there isn't room beside
// the note (narrow windows / phones) it collapses to a floating "contents"
// button that opens the same list.
//
// it lives *outside* the modal's scroll container (a sibling in case-study-modal)
// and is `fixed`, so the tabs stay pinned while the note scrolls behind them.
export function CaseStudyToc({
  scrollRef,
  noteRef,
  slug,
  noteColor,
}: {
  // the modal's scroll container (spy + jump target)
  scrollRef: RefObject<HTMLElement | null>;
  // the note wrapper — holds the headings and defines the right edge the rail
  // attaches to
  noteRef: RefObject<HTMLElement | null>;
  // changes when a different case study opens, so we re-read its headings
  slug: string;
  // the open note's paper colour — painted over the flags' pointed tips so they
  // read as tucked behind the note until selected.
  noteColor: string;
}) {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // x = note's right edge in viewport px; showRail = is there room for the rail
  const [x, setX] = useState<number | null>(null);
  const [showRail, setShowRail] = useState(false);
  const [open, setOpen] = useState(false);
  // the rail only mounts once the note's open animation has settled, so it
  // appears cleanly at its final x instead of snapping around mid-animation.
  // driven by a timeout (not an opacity/transform animation) so it can't get
  // stuck invisible in environments that throttle rAF-based animations.
  const [settled, setSettled] = useState(false);
  // the mounted rail element, so the scroll-spy can read each flag's real
  // position and light the flag whose heading has reached it (rather than a
  // single guessed line that matches no flag).
  const railRef = useRef<HTMLElement | null>(null);
  // while a click is jumping to a heading, the scroll-spy is held off the clicked
  // flag so lazy images loading in (which shift the layout mid-jump) can't make
  // it briefly light the wrong flag. the re-align interval id lives here too so
  // it can be cancelled if the study changes mid-jump.
  const spyLock = useRef(false);
  const alignTimer = useRef<number | null>(null);

  // the rail lists only the act headings (markdown `#`, tagged `data-act`),
  // not every section.
  const headings = useCallback(
    () =>
      Array.from(
        noteRef.current?.querySelectorAll<HTMLElement>("[data-act]") ?? [],
      ),
    [noteRef],
  );

  // read the section list + measure where the rail should sit. re-run when the
  // study changes, after the open animation settles, and on resize.
  useEffect(() => {
    const measure = () => {
      const note = noteRef.current;
      if (!note) return;
      setSections(
        headings().map((h) => ({ id: h.id, text: h.textContent ?? "" })),
      );
      const rect = note.getBoundingClientRect();
      setX(rect.right);
      // only show the side rail when there's real estate for it beside the note
      setShowRail(window.innerWidth - rect.right >= 168 && window.innerWidth >= 1024);
    };
    setSettled(false);
    measure();
    const t1 = window.setTimeout(() => {
      measure();
      setSettled(true);
    }, 440);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t1);
      window.removeEventListener("resize", measure);
    };
  }, [slug, headings, noteRef]);

  // scroll-spy: the active section is the last heading whose top has passed a
  // line a little below the note's top edge.
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const onScroll = () => {
      // a click is mid-jump: it holds the active flag itself (and re-aligns as
      // lazy images shift the layout), so don't let the spy fight it.
      if (spyLock.current) return;
      const hs = headings();
      if (!hs.length) return;
      // scrolled to the very bottom: the last section is active even though its
      // heading may never reach its flag (there's no room left to scroll it up).
      if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) {
        setActiveId(hs[hs.length - 1].id);
        return;
      }
      const top = sc.getBoundingClientRect().top;
      const btns = railRef.current
        ? Array.from(railRef.current.querySelectorAll("button"))
        : [];
      // a flag lights once its heading's *visible text* has scrolled up to that
      // flag's centre. headings carry top padding (the chapter rule + gap) above
      // the text, so we add it in — that's the same point `go` lands a click on,
      // so the flag the spy lights and the flag you click never disagree.
      let current = hs[0].id;
      hs.forEach((h, i) => {
        const pad = parseFloat(getComputedStyle(h).paddingTop) || 0;
        const textTop = h.getBoundingClientRect().top + pad - top;
        const btn = btns[i]?.getBoundingClientRect();
        const line = btn ? btn.top + btn.height / 2 - top : sc.clientHeight * 0.44;
        // +2px slack so the boundary landing of a click counts despite rounding.
        if (textTop <= line + 2) current = h.id;
      });
      setActiveId(current);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => sc.removeEventListener("scroll", onScroll);
  }, [sections, scrollRef, headings]);

  // scroll the section's heading up so it lands level with the clicked flag —
  // so the flag reads as pointing right at its heading. `flagTop` is the clicked
  // flag's viewport top (falls back to a spot near the top for the mobile list).
  const go = useCallback(
    (id: string, flagCenter?: number) => {
      const sc = scrollRef.current;
      const note = noteRef.current;
      if (!sc || !note) return;
      const h = note.querySelector<HTMLElement>(`[id="${id}"]`);
      if (!h) return;
      // land the heading's *visible text* level with the clicked flag's centre,
      // so the flag reads as pointing right at it. the heading's top padding
      // (chapter rule + gap) sits above the text, so add it to the box top.
      // recomputed each pass because lazy images loading in above the heading
      // shift where it sits mid-jump.
      const targetFor = () => {
        const pad = parseFloat(getComputedStyle(h).paddingTop) || 0;
        const landAt = flagCenter ?? sc.getBoundingClientRect().top + 24;
        return sc.scrollTop + h.getBoundingClientRect().top + pad - landAt;
      };
      setOpen(false);
      // light the clicked flag *synchronously* and commit it before moving the
      // scroll, so there's no frame where the page has jumped but the old flag
      // is still lit (that one-frame mismatch read as a flicker).
      flushSync(() => setActiveId(id));
      // hold the spy off this flag and re-align for a short window: the first
      // jump is computed from the pre-load layout, and as images below load the
      // heading drifts — without this, the last flag lands short on the first
      // click (and the spy lights the flag above it) and only a second click
      // catches up. polling (not rAF) so a throttled tab still releases the lock.
      spyLock.current = true;
      if (alignTimer.current != null) window.clearInterval(alignTimer.current);
      sc.scrollTop = targetFor();
      let elapsed = 0;
      alignTimer.current = window.setInterval(() => {
        const target = targetFor();
        if (Math.abs(target - sc.scrollTop) > 1) sc.scrollTop = target;
        elapsed += 50;
        if (elapsed >= 600) {
          window.clearInterval(alignTimer.current!);
          alignTimer.current = null;
          spyLock.current = false;
        }
      }, 50);
    },
    [scrollRef, noteRef],
  );

  // if the study swaps out mid-jump, drop any in-flight re-align and free the spy.
  useEffect(() => {
    return () => {
      if (alignTimer.current != null) window.clearInterval(alignTimer.current);
      alignTimer.current = null;
      spyLock.current = false;
    };
  }, [slug]);

  if (sections.length < 2) return null;

  // a rail flag: the page-flag shape (body + pointed tip on the left). the tip
  // sits over the note and is hidden by the note-coloured mask; the selected flag
  // rides above the mask (z-3) so its tip shows. monochrome: burgundy when
  // active, faint ivory idle. clicking scrolls its heading level with the flag.
  const railTab = (s: Section) => {
    const active = s.id === activeId;
    return (
      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          go(s.id, r.top + r.height / 2);
        }}
        style={{
          backgroundColor: active ? FLAG_ACTIVE_BG : FLAG_IDLE_BG,
          color: active ? FLAG_ACTIVE_TEXT : FLAG_IDLE_TEXT,
          clipPath: "polygon(15px 0, 100% 0, 100% 100%, 15px 100%, 0 50%)",
          // drop-shadow (not box-shadow) so it follows the clipped arrow outline
          // instead of being clipped away — gives the flags definition.
          filter: active
            ? "drop-shadow(2px 2px 3px rgba(44,38,32,0.4))"
            : "drop-shadow(1px 1px 1.5px rgba(44,38,32,0.22))",
        }}
        className={`relative block whitespace-nowrap py-1.5 pl-6 pr-3.5 text-left font-body text-xs ${
          active ? "z-[3] font-medium" : "z-[1]"
        }`}
      >
        {s.text}
      </button>
    );
  };

  // the mobile panel row — same monochrome scheme.
  const panelTab = (s: Section) => {
    const active = s.id === activeId;
    return (
      <button
        type="button"
        onClick={() => go(s.id)}
        className={`block w-full rounded-md px-2.5 py-1.5 text-left font-body text-[13px] leading-snug transition-colors ${
          active ? "bg-wax font-medium text-paper" : "text-wax hover:bg-wax/10"
        }`}
      >
        {s.text}
      </button>
    );
  };

  return (
    <>
      {/* wide screens: the flags stay together as one stack pinned to the right
          of the note. clicking a flag scrolls its heading up level with the flag,
          so it reads as pointing at that section. the mask hides every tip except
          the selected one, whose arrow shows over the note. */}
      {showRail && x != null && (
        <nav
          ref={railRef}
          aria-label="sections"
          className="pointer-events-none fixed top-[30%] z-[110]"
          // the rail is measured while the note is still springing open, so its
          // flags stay hidden until `settled` (they're at their final x by then)
          // and then cascade in one-by-one from the note's edge — see the per-flag
          // stagger below. `settled` is a timeout-driven state (not rAF) so a
          // throttled tab can't leave the rail stuck hidden.
          style={{ left: x - 15 }}
        >
          {/* note-coloured mask over the 15px tip column. faded with the rail so a
              note-coloured strip doesn't flash at the edge before the flags arrive. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[15px]"
            style={{
              backgroundColor: noteColor,
              opacity: settled ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
          <ul
            className="relative flex flex-col gap-2 py-2 pr-2"
            // don't catch clicks until the rail has appeared.
            style={{ pointerEvents: settled ? "auto" : "none" }}
          >
            {sections.map((s, i) => (
              <li
                key={s.id}
                style={{
                  // each flag fades + slides in from the note's edge, staggered by
                  // its position so they land top-to-bottom like a dealt hand of
                  // index cards rather than the whole rail popping at once.
                  opacity: settled ? 1 : 0,
                  transform: settled ? "translateX(0)" : "translateX(16px)",
                  transition:
                    "opacity 0.4s ease, transform 0.45s cubic-bezier(0.2,0.7,0.2,1)",
                  transitionDelay: settled ? `${i * 80}ms` : "0ms",
                  // the transform above makes each <li> its own stacking context,
                  // which would trap the button's z-index inside it and paint the
                  // active flag's tip *under* the note-coloured mask. so the
                  // active/idle layering lives on the <li> instead: the selected
                  // flag (z-3) rides above the mask (z-2) so its tip shows; the
                  // rest (z-1) stay tucked behind it.
                  position: "relative",
                  zIndex: s.id === activeId ? 3 : 1,
                }}
              >
                {railTab(s)}
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* narrow screens: a floating "contents" button + popover list */}
      {!showRail && (
        <div className="fixed bottom-5 right-5 z-[110]">
          {open && (
            <div className="absolute bottom-12 right-0 max-h-[60vh] w-52 overflow-y-auto rounded-2xl bg-paper p-1.5 shadow-2xl ring-1 ring-ink/10">
              <ul className="flex flex-col gap-0.5">
                {sections.map((s) => (
                  <li key={s.id}>{panelTab(s)}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="sections"
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.12em] text-paper shadow-lg transition hover:bg-ink/90"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </>
              )}
            </svg>
            contents
          </button>
        </div>
      )}
    </>
  );
}
