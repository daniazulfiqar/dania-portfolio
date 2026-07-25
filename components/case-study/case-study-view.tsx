import type { CaseStudy } from "@/lib/case-studies";
import { Reveal } from "@/components/reveal";
import { ImpactChart } from "@/components/case-study/impact-chart";

export function CaseStudyView({ study }: { study: CaseStudy }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-20 px-6 pb-28 pt-10 sm:px-10 sm:pt-16">
      <header>
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-ink-soft">
          case study
        </p>
        <h1 className="font-display text-2xl italic leading-snug text-ink sm:text-3xl">
          {study.hook}
        </h1>
      </header>

      <Reveal>
        <section aria-labelledby="context-heading" className="flex flex-col gap-4">
          <h2 id="context-heading" className="font-display text-xl text-wax">
            context &amp; stakes
          </h2>
          <p className="font-body leading-relaxed text-ink-soft">{study.context}</p>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="role-heading" className="flex flex-col gap-4">
          <h2 id="role-heading" className="font-display text-xl text-wax">
            my role &amp; constraints
          </h2>
          <p className="font-body leading-relaxed text-ink-soft">{study.role}</p>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="thinking-heading" className="flex flex-col gap-8">
          <h2 id="thinking-heading" className="font-display text-xl text-wax">
            the thinking
          </h2>
          <div className="flex flex-col gap-6">
            {study.thinking.map((decision) => (
              <div key={decision.title}>
                <h3 className="mb-2 font-body font-semibold text-ink">
                  {decision.title}
                </h3>
                <p className="font-body leading-relaxed text-ink-soft">
                  {decision.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="execution-heading" className="flex flex-col gap-6">
          <h2 id="execution-heading" className="font-display text-xl text-wax">
            execution
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {study.execution.map((artifact) => (
              <figure
                key={artifact.caption}
                className="flex flex-col gap-2"
              >
                <div className="aspect-[4/3] rounded-md border border-dashed border-ink/20 bg-ink/5" />
                <figcaption className="font-body text-xs text-ink-soft">
                  {artifact.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="impact-heading" className="flex flex-col gap-6">
          <h2 id="impact-heading" className="font-display text-xl text-wax">
            impact
          </h2>
          <p className="font-body leading-relaxed text-ink-soft">
            {study.impact.summary}
          </p>
          <ImpactChart stats={study.impact.stats} />
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="reflection-heading" className="flex flex-col gap-4">
          <h2 id="reflection-heading" className="font-display text-xl text-wax">
            reflection
          </h2>
          <p className="font-body leading-relaxed text-ink-soft">
            {study.reflection}
          </p>
        </section>
      </Reveal>
    </article>
  );
}
