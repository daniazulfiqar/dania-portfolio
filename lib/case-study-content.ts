import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content/work");

// reads a case study's markdown (by slug) and prepares it for rendering.
// returns null if there's no file for that slug (i.e. it's still a draft).
export function getCaseStudyMarkdown(slug: string): string | null {
  try {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.md`), "utf8");
    return preprocess(raw);
  } catch {
    return null;
  }
}

// the source files carry a bit of author scaffolding that shouldn't reach a
// visitor. this strips it and normalises the image/diagram callouts so the
// renderer can treat them all the same way:
//   - drops the front-matter block (title + card meta) above the first `---`,
//     since the title and card copy are shown separately in the page header
//   - drops a lone "## Body" heading
//   - turns "> **screenshot to add here:** …" author notes into image
//     placeholders, using the note text as the caption
//   - turns bare "[ … goes here ]" bracket lines into image placeholders
// real markdown images (![alt](path)) are left as-is; the renderer shows a
// captioned placeholder for every image since the assets aren't in yet.
function preprocess(md: string): string {
  const lines = md.split("\n");
  const firstRule = lines.findIndex((line) => /^---\s*$/.test(line.trim()));
  const body = (firstRule >= 0 ? lines.slice(firstRule + 1) : lines).filter(
    (line) => line.trim().toLowerCase() !== "## body",
  );

  const normalised = body.map((line) => {
    const trimmed = line.trim();

    const shot = trimmed.match(/^>\s*\*\*screenshot to add here:?\*\*\s*(.*)$/i);
    if (shot) return `![${cleanCaption(shot[1])}](#placeholder)`;

    const bracket = trimmed.match(/^\[\s*(.+?)\s*\]$/);
    if (bracket) return `![${cleanCaption(bracket[1])}](#placeholder)`;

    return line;
  });

  return normalised.join("\n").trim();
}

// alt text can't contain a closing bracket without breaking the image syntax;
// strip any and tidy leading punctuation.
function cleanCaption(text: string): string {
  return text.replace(/[[\]]/g, "").replace(/^[:\s]+/, "").trim();
}
