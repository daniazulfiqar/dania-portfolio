// a case study that's written and rendered from its markdown in content/work.
export type WrittenCaseStudy = {
  draft?: false;
  slug: string;
  title: string;
};

// a case study that's still being written — its page shows the DRAFT_NOTE
// instead of the full write-up.
export type DraftCaseStudy = {
  draft: true;
  slug: string;
  title: string;
};

export type CaseStudy = WrittenCaseStudy | DraftCaseStudy;

// shown on any case study still in progress. dania's words, kept verbatim.
export const DRAFT_NOTE =
  "still writing this one. turns out taking out time out of a full workday to write about your work is harder than it sounds — i'll update these soon, but im happy to chat and talk more about these!";

// slugs match the card ids in lib/good-ones.ts so every card routes correctly.
// titles match the card titles for continuity from card → page.
export const caseStudies: CaseStudy[] = [
  { slug: "acquisition-pipeline", title: "ai acquisition pipeline" },
  { slug: "student-counsellor", title: "the student counsellor" },
  { draft: true, slug: "zero-to-admission", title: "zero to university admission" },
  { draft: true, slug: "fountain", title: "traditional pump business" },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
