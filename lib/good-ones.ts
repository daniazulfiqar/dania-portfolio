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
  // the live thing itself, where that's better proof than screenshots.
  liveUrl?: string;
};

export const goodOnes: GoodOne[] = [
  {
    id: "acquisition-pipeline",
    title: "the three-agent acquisition pipeline",
    summary:
      "built the three-agent ai system running maqsad's acquisition, taking qualified leads from 30% to 85% and conversion from 2% to 10%.",
    tags: ["ai systems", "llm agents", "growth"],
    icon: "trend",
    company: "maqsad",
  },
  {
    id: "student-counsellor",
    title: "the student counsellor",
    summary:
      "shipped an llm counsellor from zero that handles 500+ leads a day and cut manual chat handling by ~95%.",
    tags: ["ai", "0-to-1", "ops"],
    icon: "gauge",
    company: "maqsad",
  },
  {
    id: "zero-to-admission",
    title: "zero to university admission",
    summary:
      "how the product evolved to take a student from signup all the way to a top-school admission.",
    tags: ["product arc", "edtech", "retention"],
    icon: "chart",
    company: "maqsad",
  },
  {
    id: "fountain",
    title: "growth for a traditional pump business",
    summary:
      "got my dad's offline pump business online from scratch, no team, no budget, and grew it.",
    tags: ["0-to-1", "scrappy", "e-commerce"],
    icon: "compare",
    company: "fountain",
    // TODO: the live fountain site — drop the real url in here.
    liveUrl: undefined,
  },
];
