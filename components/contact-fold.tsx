"use client";

import { motion, useReducedMotion } from "framer-motion";

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

  return (
    <section
      id="contact"
      className="flex scroll-mt-24 flex-col items-center bg-paper px-6 pb-16 pt-28 sm:px-10 sm:pb-20 sm:pt-36"
    >
      <motion.div
        className="flex w-full flex-col items-center text-center"
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="shown"
        viewport={{ once: true, amount: 0.4 }}
      >
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
        className="group mt-32 flex w-fit max-w-none flex-col items-center gap-2 px-6 text-center sm:mt-44"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <span className="whitespace-nowrap font-body text-xs italic text-ink/40 transition-colors duration-200 group-hover:text-wax sm:text-sm">
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
