// placeholder content for the "good ones" folder — swap these out once real
// project write-ups are ready. `icon` picks one of the small abstract
// anchors drawn in components/good-ones-folder.tsx (never a real
// screenshot, just a simple shape hinting at the kind of work).
export type GoodOneIcon = "chart" | "trend" | "compare" | "gauge";

export type GoodOne = {
  id: string;
  title: string;
  // one sentence: what she did + the outcome — no bullet lists. this is the
  // teaser shown on the card face.
  summary: string;
  // the fuller write-up, revealed when the card's "read more" is opened —
  // a few sentences, the story the teaser is standing in for.
  detail: string;
  tags: string[];
  icon: GoodOneIcon;
};

const PLACEHOLDER_DETAIL =
  "placeholder detail — the fuller version of this story. what the problem was, what i actually built or shipped, the constraints i worked around, and the outcome it drove. swap this out for the real write-up once it's ready.";

export const goodOnes: GoodOne[] = [
  {
    id: "placeholder-one",
    title: "project title one",
    summary:
      "placeholder — what i did on this project and the outcome it led to, in one sentence.",
    detail: PLACEHOLDER_DETAIL,
    tags: ["product", "0 → 1"],
    icon: "chart",
  },
  {
    id: "placeholder-two",
    title: "project title two",
    summary:
      "placeholder — what i did on this project and the outcome it led to, in one sentence.",
    detail: PLACEHOLDER_DETAIL,
    tags: ["strategy", "growth"],
    icon: "trend",
  },
  {
    id: "placeholder-three",
    title: "project title three",
    summary:
      "placeholder — what i did on this project and the outcome it led to, in one sentence.",
    detail: PLACEHOLDER_DETAIL,
    tags: ["research", "redesign"],
    icon: "compare",
  },
  {
    id: "placeholder-four",
    title: "project title four",
    summary:
      "placeholder — what i did on this project and the outcome it led to, in one sentence.",
    detail: PLACEHOLDER_DETAIL,
    tags: ["ops", "0 → 1", "solo"],
    icon: "gauge",
  },
];
