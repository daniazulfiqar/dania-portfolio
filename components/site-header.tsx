import Link from "next/link";

// nav links — anchors for now; point them at real routes/sections once those
// exist.
const NAV_LINKS = [
  { label: "about", href: "#about" },
  { label: "work", href: "#work" },
  { label: "contact", href: "#contact" },
];

// fixed top nav, openwhen-style: a script wordmark on the left, spaced-out
// uppercase links, and a solid pill CTA on the right, over a translucent
// paper bar that blurs whatever scrolls beneath it.
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/80 backdrop-blur">
      <nav className="mx-auto flex h-[4.75rem] max-w-[110rem] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-script text-3xl leading-none text-ink sm:text-4xl">
          dania siddiqui
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-xs uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="rounded-lg bg-ink px-4 py-2 font-body text-xs uppercase tracking-[0.15em] text-paper transition-colors hover:bg-ink/90"
        >
          get in touch
        </a>
      </nav>
    </header>
  );
}
