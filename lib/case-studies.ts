export type CaseStudyDecision = {
  title: string;
  body: string;
};

export type CaseStudyStat = {
  label: string;
  before: string;
  after: string;
};

export type CaseStudyArtifact = {
  caption: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  /** one-line hook shown big at the top of the case study page */
  hook: string;
  /** one-line hook shown on the home page card */
  cardHook: string;
  context: string;
  role: string;
  thinking: CaseStudyDecision[];
  execution: CaseStudyArtifact[];
  impact: {
    summary: string;
    stats: CaseStudyStat[];
  };
  reflection: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "project-one",
    title: "Project One",
    hook: "placeholder copy — this line will be the one-sentence outcome that makes someone want to keep reading.",
    cardHook: "placeholder hook — one line describing the win, once i write it.",
    context:
      "placeholder — a paragraph on what was broken before this project, who felt the pain, and why it mattered enough to fix. real context comes later; for now this proves the template holds a few sentences of scene-setting without feeling cramped.",
    role:
      "placeholder — a short paragraph on what was mine to own versus the team's, plus the real constraints i was working against (timeline, headcount, legacy systems, whatever it was).",
    thinking: [
      {
        title: "placeholder decision one",
        body: "placeholder — the first key call i made and why. this section is meant to be the biggest one on the page, so expect two or three of these blocks laying out the approach and the tradeoffs i weighed.",
      },
      {
        title: "placeholder decision two",
        body: "placeholder — a second decision, ideally one where the obvious choice wasn't the right one, and here's the reasoning for going a different way.",
      },
      {
        title: "placeholder decision three",
        body: "placeholder — a third decision or a synthesis of how the earlier calls fit together into one approach.",
      },
    ],
    execution: [
      { caption: "placeholder — screen or artifact one" },
      { caption: "placeholder — screen or artifact two" },
      { caption: "placeholder — screen or artifact three" },
    ],
    impact: {
      summary:
        "placeholder — a sentence framing the headline result before the numbers back it up.",
      stats: [
        { label: "placeholder metric one", before: "12%", after: "34%" },
        { label: "placeholder metric two", before: "6.2s", after: "1.8s" },
        { label: "placeholder metric three", before: "40", after: "210" },
      ],
    },
    reflection:
      "placeholder — what i'd do differently with what i know now, written plainly, no spin.",
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
