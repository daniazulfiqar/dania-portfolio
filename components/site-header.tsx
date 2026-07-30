import { BrandMark } from "./brand-mark";

// nav links — anchors for now; point them at real routes/sections once those
// exist.
const NAV_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "about", href: "#about" },
  { label: "work", href: "#work" },
  { label: "contact", href: "#contact" },
  { label: "resume", href: "/Dania_Siddiqui_CV.pdf", external: true },
];

// fixed top nav, openwhen-style: a script wordmark on the left, spaced-out
// uppercase links, and a solid pill CTA on the right, over a translucent
// paper bar that blurs whatever scrolls beneath it.
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/80 backdrop-blur">
      <nav className="mx-auto flex h-[4.75rem] max-w-[110rem] items-center justify-between px-4 sm:px-6">
        <BrandMark />

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

        <a
          href="#contact"
          className="rounded-lg bg-ink px-4 py-2 font-body text-xs uppercase tracking-[0.15em] text-paper shadow-sm transition duration-200 [transition-timing-function:var(--ease-out-quint)] hover:-translate-y-px hover:bg-ink/90 hover:shadow-md active:translate-y-0 active:scale-[0.97] motion-reduce:transform-none"
        >
          get in touch
        </a>
      </nav>
    </header>
  );
}
