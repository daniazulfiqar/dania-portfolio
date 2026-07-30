"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CaseStudyNoteBody } from "@/components/case-study/case-study-note";

// the case study a card opens, as an in-page pop-up rather than a route change.
// `study` being null means nothing's open (the overlay is unmounted).
export type OpenStudy = {
  slug: string;
  title: string;
  summary?: string;
  tags?: string[];
  note: string;
  markdown: string | null;
};

export function CaseStudyModal({
  study,
  onClose,
}: {
  study: OpenStudy | null;
  onClose: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  // close on escape, and lock the page scroll while the note is open so the
  // background doesn't drift behind it.
  useEffect(() => {
    if (!study) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [study, onClose]);

  if (!study) return null;

  return (
    // plain conditional mount rather than AnimatePresence: the note pops in on
    // mount and unmounts instantly on close. (AnimatePresence's exit was leaving
    // the faded-out overlay mounted over the page, blocking every click.)
    <motion.div
      className="fixed inset-0 z-[100] flex justify-center overflow-y-auto overscroll-contain bg-ink/40 px-4 py-10 backdrop-blur-sm sm:px-8 sm:py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${study.title} — case study`}
    >
      {/* the note pops up from slightly small + low, springing into place.
          stops click-through so clicks inside it don't close the overlay. */}
      <motion.div
        className="relative my-auto w-full max-w-3xl"
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.94, y: 24 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
            {/* tape strip along the top edge, matching the home cards */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-4 left-1/2 z-10 h-8 w-32 -translate-x-1/2 -rotate-1 bg-ochre/25"
            />

            {/* close button, tucked into the top-right of the note */}
            <button
              type="button"
              onClick={onClose}
              aria-label="close case study"
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink/60 transition hover:bg-ink/10 hover:text-ink"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <article
              className="relative rounded-[4px] px-6 py-10 shadow-[0_28px_60px_-24px_rgba(44,38,32,0.6)] ring-1 ring-black/5 sm:px-14 sm:py-16"
              style={{ backgroundColor: study.note }}
            >
              <CaseStudyNoteBody
                title={study.title}
                summary={study.summary}
                tags={study.tags}
                markdown={study.markdown}
              />
            </article>
      </motion.div>
    </motion.div>
  );
}
