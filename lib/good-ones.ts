// the four cards on the "some of the good ones" surface. each one has to
// carry its own punchline: someone giving the site 30 seconds reads these
// cards, not the case studies. `icon` picks one of the small abstract anchors
// drawn in components/projects-fold.tsx (never a real screenshot, just a
// simple shape hinting at the kind of work).
export type GoodOneIcon = "chart" | "trend" | "compare" | "gauge";

// which business the project was for — drives the small taped logo in the
// bottom-right of each card. maps to a file in /public/images below.
export type GoodOneCompany = "maqsad" | "fountain";

export type GoodOne = {
  id: string;
  title: string;
  // one sentence: what i did + the outcome. no bullet lists.
  summary: string;
  tags: string[];
  icon: GoodOneIcon;
  company: GoodOneCompany;
  // a real card thumbnail (in /public), shown in the note's image frame in
  // place of the abstract `icon` anchor when present.
  image?: string;
  // an optional bespoke thumbnail rendered in the image frame (a small scene
  // drawn in components/projects-fold.tsx) instead of a flat `image`. right now
  // only "counsellor" (the avatar with a chat bubble) and "pipeline" (an emoji
  // flow chart of the three-agent acquisition system).
  thumbnail?: "counsellor" | "pipeline";
  // the live thing itself, where that's better proof than screenshots.
  liveUrl?: string;
};

export const goodOnes: GoodOne[] = [
  {
    id: "acquisition-pipeline",
    title: "ai acquisition pipeline",
    summary:
      "built a three-agent system (sales agent, classifying agent, campaign analyser) to better understand lead quality and conversion",
    tags: ["multi-agent system", "lead classification", "conversion"],
    icon: "trend",
    company: "maqsad",
    thumbnail: "pipeline",
  },
  {
    id: "student-counsellor",
    title: "the student counsellor",
    summary:
      "maqsad's admissions counsellor to guide stressed out exam students from navigating prep to handling enrollment",
    tags: ["llm agent", "tool calling", "conversion", "student psychology"],
    icon: "gauge",
    company: "maqsad",
    thumbnail: "counsellor",
  },
  {
    id: "zero-to-admission",
    title: "zero to university admission",
    summary:
      "how the product evolved to take a student from signup all the way to a top-school admission",
    tags: ["edtech", "0→1", "student results", "mobile app", "web app"],
    icon: "chart",
    company: "maqsad",
    image: "/images/work/zero-to-admission-v3.png",
  },
  {
    id: "fountain",
    title: "traditional pump business",
    summary:
      "built my dad's offline pump business its first website from scratch for b2b trust and product discovery",
    tags: ["0→1", "e-commerce", "technical seo", "web app"],
    icon: "compare",
    company: "fountain",
    image: "/images/work/fountain-v3.png",
    // TODO: the live fountain site — drop the real url in here.
    liveUrl: undefined,
  },
];

// the sticky-note palette — yellow, pink, blue, green — indexed by a card's
// position in `goodOnes`. shared by the work cards (components/projects-fold)
// and the case-study pages, so each study opens as a note in the exact colour
// the visitor just clicked.
export const NOTE_COLORS = ["#fdf3bf", "#fbdce7", "#d9ebf7", "#dcefd4"];

// the note colour for a given card/case-study id (they share the same id).
// falls back to the first note if the id isn't a known card.
export function noteColorFor(id: string): string {
  const i = goodOnes.findIndex((project) => project.id === id);
  return NOTE_COLORS[(i < 0 ? 0 : i) % NOTE_COLORS.length];
}
