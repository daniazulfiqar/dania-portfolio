"use client";

import { useState } from "react";
import { BrandMark } from "./brand-mark";

// nav links — anchors for now; point them at real routes/sections once those
// exist.
const NAV_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "about", href: "#about" },
  { label: "work", href: "#work" },
  { label: "contact", href: "#contact" },
  { label: "resume", href: "/Dania_Siddiqui_CV.pdf", external: true },
];

// socials for the mobile menu — shown as icons rather than text.
type SocialIcon = "linkedin" | "github" | "mail";
const SOCIALS: { label: string; href: string; icon: SocialIcon; external?: boolean }[] = [
  { label: "LinkedIn", href: "https://linkedin.com/in/daniazulfiqar", icon: "linkedin", external: true },
  { label: "GitHub", href: "https://github.com/daniazulfiqar", icon: "github", external: true },
  { label: "Email", href: "mailto:dania.siddiqui2000@gmail.com", icon: "mail" },
];

// same line-icon idiom as the contact fold, so the two read as one hand.
function SocialIconSvg({ name }: { name: SocialIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
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
          <path
            d="M12 3a9 9 0 0 0-2.85 17.54c.45.08.6-.2.6-.43v-1.68c-2.45.53-3-1.09-3-1.09-.4-1.03-.98-1.3-.98-1.3-.8-.55.06-.54.06-.54.89.06 1.36.91 1.36.91.79 1.36 2.07.97 2.58.74.08-.58.31-.97.56-1.2-1.96-.22-4.02-.98-4.02-4.37 0-.97.34-1.75.91-2.37-.09-.22-.4-1.12.09-2.34 0 0 .74-.24 2.43.91a8.4 8.4 0 0 1 4.42 0c1.69-1.15 2.43-.91 2.43-.91.49 1.22.18 2.12.09 2.34.57.62.91 1.4.91 2.37 0 3.4-2.07 4.15-4.04 4.37.32.28.6.82.6 1.65v2.45c0 .23.15.51.6.43A9 9 0 0 0 12 3z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
  }
}

// fixed top nav, openwhen-style: a script wordmark on the left, spaced-out
// uppercase links, and a solid pill CTA on the right, over a translucent
// paper bar that blurs whatever scrolls beneath it. on mobile the links + CTA
// collapse into a hamburger menu.
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/80 backdrop-blur">
      <nav className="mx-auto flex h-[4.75rem] max-w-[110rem] items-center justify-between px-4 sm:px-6">
        <BrandMark />

        {/* desktop links */}
        <div className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="font-body text-xs uppercase tracking-[0.15em] text-ink-soft transition-[color,transform] duration-200 [transition-timing-function:var(--ease-out-quint)] hover:-translate-y-px hover:text-ink motion-reduce:hover:translate-y-0"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* desktop CTA — hidden on mobile in favour of the hamburger */}
        <a
          href="#contact"
          className="hidden rounded-lg bg-ink px-4 py-2 font-body text-xs uppercase tracking-[0.15em] text-paper shadow-sm transition duration-200 [transition-timing-function:var(--ease-out-quint)] hover:-translate-y-px hover:bg-ink/90 hover:shadow-md active:translate-y-0 active:scale-[0.97] motion-reduce:transform-none sm:inline-block"
        >
          get in touch
        </a>

        {/* mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-ink/[0.06] sm:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6 6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* mobile dropdown panel */}
      {open && (
        <div id="mobile-menu" className="border-t border-ink/10 bg-paper/95 backdrop-blur sm:hidden">
          <div className="flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="rounded-lg px-3 py-3 font-body text-sm uppercase tracking-[0.15em] text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink"
              >
                {link.label}
              </a>
            ))}

            {/* socials, as icons */}
            <div className="mt-2 flex items-center gap-2 border-t border-ink/10 px-1 pt-4">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  onClick={() => setOpen(false)}
                  {...(s.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
                >
                  <SocialIconSvg name={s.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
