"use client";

import { useMemo, type ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { DRAFT_NOTE } from "@/lib/case-studies";
import { COMPANY_LOGOS, type GoodOneCompany } from "@/lib/good-ones";

// the note title — big (text-4xl) and one line on the wide desktop modal; on a
// phone it drops to text-2xl (via the article's max-sm rule) and wraps rather
// than shrinking to an unreadable size.
const TITLE_CLASS =
  "font-heading text-3xl font-semibold leading-tight text-ink max-sm:!text-[1.4rem] sm:text-4xl";

// flatten a heading's children to plain text, then to a url-safe slug — used as
// the heading's id so the in-note table of contents (case-study-toc) can jump
// to it.
function nodeText(node: ReactNode): string {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (typeof node === "object" && "props" in node) {
    return nodeText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

export function slugifyHeading(node: ReactNode): string {
  return nodeText(node)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// a captioned dashed box standing in for a diagram/screenshot until the real
// asset is dropped in. every image + author "screenshot to add here" note in
// the source renders through here (see lib/case-study-content.ts).
function ImagePlaceholder({ caption }: { caption?: string }) {
  return (
    <span className="my-8 flex flex-col items-center gap-3">
      <span className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-dashed border-ink/25 bg-ink/[0.03] text-ink/25">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m3 16 5-4 4 3 3-2 6 5" />
        </svg>
      </span>
      {caption && (
        <span className="max-w-xl text-center font-body text-xs leading-relaxed text-ink-soft">
          {caption}
        </span>
      )}
    </span>
  );
}

// maps every markdown node to the site's paper/ink theme. headings take the
// wax accent (like the rest of the site), tables scroll on narrow screens,
// and images become captioned placeholders. built as a factory so links to
// another case study (href "#cs-<slug>") can call back into the page and swap
// the open study in place instead of opening a new tab.
function makeComponents(
  onOpenStudy?: (slug: string) => void,
): Components {
  return {
  // markdown `#` is an act heading — the story's three-ish beats. `data-act`
  // marks it for the table of contents (case-study-toc reads only these), and a
  // hairline rule + big top margin make each one read as a new chapter.
  h1: ({ children }) => (
    <h2
      data-act=""
      id={slugifyHeading(children)}
      className="mb-6 mt-20 scroll-mt-4 border-t border-ink/15 pt-9 font-heading text-3xl font-bold text-wax first:mt-0 first:border-t-0 first:pt-0"
    >
      {children}
    </h2>
  ),
  // markdown `##` is a section within an act.
  h2: ({ children }) => (
    <h3
      id={slugifyHeading(children)}
      className="mb-3 mt-11 scroll-mt-4 font-heading text-xl font-semibold text-ink"
    >
      {children}
    </h3>
  ),
  // markdown `###` is a sub-point within a section.
  h3: ({ children }) => (
    <h4 className="mb-2 mt-7 font-heading text-base font-semibold text-ink/90">
      {children}
    </h4>
  ),
  p: ({ node, children }) => {
    // standalone images arrive wrapped in a <p>; unwrap so the placeholder
    // (a block) isn't nested inside a paragraph.
    const kids = node?.children ?? [];
    if (
      kids.length === 1 &&
      kids[0].type === "element" &&
      kids[0].tagName === "img"
    ) {
      return <>{children}</>;
    }
    return (
      <p className="my-4 font-body leading-relaxed text-ink-soft">{children}</p>
    );
  },
  ul: ({ children }) => (
    <ul className="my-4 flex list-disc flex-col gap-2.5 pl-5 font-body leading-relaxed text-ink-soft marker:text-ink/30">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 flex list-decimal flex-col gap-2.5 pl-5 font-body leading-relaxed text-ink-soft marker:text-ink/40">
      {children}
    </ol>
  ),
  // `[&>p]:my-0` collapses the paragraph markdown wraps around a "loose" list
  // item (one with blank lines between items) — without it every bullet piled
  // on a full paragraph's margin and the list read as huge gaps. nested lists
  // get a small, even inset instead of the top-level `my-4`.
  li: ({ children }) => (
    <li className="pl-1 [&>ol]:my-1.5 [&>p]:my-0 [&>ul]:my-1.5">{children}</li>
  ),
  a: ({ href, children }) => {
    // a "#cs-<slug>" link points at another case study; intercept it and swap
    // the open note in place rather than navigating away.
    if (href?.startsWith("#cs-")) {
      const slug = href.slice(4);
      return (
        <button
          type="button"
          onClick={() => onOpenStudy?.(slug)}
          className="font-body text-wax underline underline-offset-2 hover:text-wax/80"
        >
          {children}
        </button>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-wax underline underline-offset-2 hover:text-wax/80"
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-wax/40 pl-4 font-body italic leading-relaxed text-ink-soft">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-12 border-ink/10" />,
  img: ({ src, alt }) => {
    // author notes with no real asset yet come through as "#placeholder" (see
    // lib/case-study-content.ts) — show the dashed stand-in for those. anything
    // with a real path renders as a captioned figure, matted on a white card so
    // transparent diagrams read cleanly on the coloured note.
    if (!src || typeof src !== "string" || src === "#placeholder") {
      return <ImagePlaceholder caption={alt || undefined} />;
    }
    // our hand-drawn svg diagrams have transparent backgrounds; they sit on the
    // same graph-paper as the work cards so the two read as one family. raster
    // screenshots keep a plain white mat (a photo on graph paper looks odd).
    const isDiagram = src.split("?")[0].endsWith(".svg");
    // alt text may carry a "heading | caption" pair: the heading is a small
    // label above the figure, the caption sits below it. a plain alt with no
    // " | " is treated as caption-only.
    const [rawHeading, ...captionParts] = (alt || "").split(" | ");
    const hasHeading = captionParts.length > 0;
    const heading = hasHeading ? rawHeading : "";
    const caption = hasHeading ? captionParts.join(" | ") : alt;
    return (
      <span className="my-8 flex flex-col items-center gap-3">
        {heading && (
          <span className="font-heading text-sm font-semibold lowercase tracking-tight text-ink">
            {heading}
          </span>
        )}
        <span
          className={`w-full overflow-hidden rounded-lg border border-ink/10 shadow-sm ${
            isDiagram ? "p-4 sm:p-6" : "bg-white p-2 sm:p-3"
          }`}
          style={
            isDiagram
              ? {
                  backgroundColor: "#f3f5f8",
                  backgroundImage:
                    "linear-gradient(#e0e5ec 1px, transparent 1px), linear-gradient(90deg, #e0e5ec 1px, transparent 1px)",
                  backgroundSize: "13px 13px",
                }
              : undefined
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={caption || ""} loading="lazy" className="w-full rounded" />
        </span>
        {caption && (
          <span className="max-w-xl text-center font-body text-xs leading-relaxed text-ink-soft">
            {caption}
          </span>
        )}
      </span>
    );
  },
  code: ({ children }) => (
    <code className="whitespace-nowrap rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left font-body text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-ink/25 px-3 py-2 align-top font-semibold text-ink">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-ink/10 px-3 py-2 align-top text-ink-soft">
      {children}
    </td>
  ),
  };
}

// the interior of a case-study sticky note: the header (label, title, summary,
// tags) and either the rendered markdown or the "still writing this" draft
// note. rendered inside the in-page pop-up (components/case-study/case-study-modal),
// which draws the taped note *shell* around it.
export function CaseStudyNoteBody({
  title,
  summary,
  tags,
  company,
  markdown,
  liveUrl,
  liveBlurb,
  liveNote,
  onOpenStudy,
}: {
  title: string;
  summary?: string;
  tags?: string[];
  company?: GoodOneCompany;
  markdown: string | null;
  liveUrl?: string;
  liveBlurb?: string;
  liveNote?: string;
  onOpenStudy?: (slug: string) => void;
}) {
  const components = useMemo(() => makeComponents(onOpenStudy), [onOpenStudy]);

  // the company's logo sits where the "case study" eyebrow used to, tying the
  // note back to the brand the work was for.
  const logo = company ? COMPANY_LOGOS[company] : null;
  const companyMark = logo && (
    <Image
      src={logo.src}
      alt={`${company} logo`}
      width={logo.width}
      height={logo.height}
      className="h-5 w-auto sm:h-6"
    />
  );

  // a live link to the real thing, shown when the study carries one — a short
  // blurb, then "here: <domain>" linking out to the site, then an optional aside.
  const liveLink = liveUrl && (
    <p className="mx-auto mt-8 max-w-xl font-body text-base leading-relaxed text-ink-soft">
      {liveBlurb ? `${liveBlurb} ` : "you can see it live "}
      here:{" "}
      <a
        href={liveUrl}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-wax underline underline-offset-2 hover:text-wax/80"
      >
        {liveUrl.replace(/^https?:\/\//, "")}
      </a>
      {liveNote ? (
        <span className="mt-2.5 block text-xs italic leading-relaxed text-ink-soft/70">
          ({liveNote})
        </span>
      ) : (
        "."
      )}
    </p>
  );

  // no markdown on disk yet → this study is still a draft.
  if (!markdown) {
    return (
      <div className="text-center">
        {companyMark && (
          <span className="mb-6 flex justify-center">{companyMark}</span>
        )}
        <h2 className={TITLE_CLASS}>{title}</h2>
        <p className="mx-auto mt-6 max-w-xl font-body text-base italic leading-relaxed text-ink-soft">
          {DRAFT_NOTE}
        </p>
        {liveLink}
      </div>
    );
  }

  return (
    <>
      <header>
        {companyMark && <span className="mb-6 flex">{companyMark}</span>}
        <h2 className={TITLE_CLASS}>{title}</h2>
        {summary && (
          <p className="mt-5 font-body text-lg leading-relaxed text-ink-soft">
            {summary}
          </p>
        )}
        {tags && tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-ink/25 px-2.5 py-0.5 font-body text-[11px] text-ink-soft"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mt-12 border-t border-ink/10 pt-10 [&>*:first-child]:mt-0">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
          // the markdown is our own trusted content; keep hrefs verbatim so the
          // "#cs-<slug>" cross-study links reach the link renderer intact.
          urlTransform={(url) => url}
        >
          {markdown}
        </ReactMarkdown>
        {liveLink}
      </div>
    </>
  );
}
