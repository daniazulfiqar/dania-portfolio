import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Link
      href={`/work/${study.slug}`}
      className="group block rounded-lg border border-ink/10 bg-white/40 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="font-display text-xl text-ink group-hover:text-wax transition-colors">
        {study.title}
      </h3>
      <p className="mt-2 font-body text-sm leading-relaxed text-ink-soft">
        {study.cardHook}
      </p>
      <span className="mt-4 inline-block font-body text-sm text-wax">
        read the story →
      </span>
    </Link>
  );
}
