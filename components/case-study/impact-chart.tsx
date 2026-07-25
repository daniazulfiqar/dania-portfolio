"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CaseStudyStat } from "@/lib/case-studies";

function Bar({
  value,
  color,
  delay,
  shouldReduceMotion,
}: {
  value: number;
  color: string;
  delay: number;
  shouldReduceMotion: boolean | null;
}) {
  const width = `${Math.max(4, Math.min(100, value))}%`;

  if (shouldReduceMotion) {
    return (
      <div className="h-2.5 rounded-full" style={{ width, backgroundColor: color }} />
    );
  }

  return (
    <motion.div
      className="h-2.5 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ width: 0 }}
      whileInView={{ width }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
    />
  );
}

export function ImpactChart({ stats }: { stats: CaseStudyStat[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <dl className="flex flex-col gap-6">
      {stats.map((stat, i) => (
        <div key={stat.label}>
          <dt className="mb-2 font-body text-sm text-ink-soft">{stat.label}</dt>
          <dd className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between font-body text-xs text-ink-soft">
                <span>before</span>
                <span>{stat.before}</span>
              </div>
              <div className="w-full rounded-full bg-ink/10">
                <Bar
                  value={35}
                  color="var(--color-ink-soft)"
                  delay={i * 0.1}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between font-body text-xs text-ink-soft">
                <span>after</span>
                <span>{stat.after}</span>
              </div>
              <div className="w-full rounded-full bg-ink/10">
                <Bar
                  value={85}
                  color="var(--color-wax)"
                  delay={i * 0.1 + 0.15}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </div>
            </div>
          </dd>
        </div>
      ))}
    </dl>
  );
}
