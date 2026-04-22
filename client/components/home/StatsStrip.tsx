interface Stat {
  value: string;
  label: string;
  accent?: "primary" | "ink";
}

interface StatsStripProps {
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  { value: "14", label: "Ակտիվ նախագիծ", accent: "primary" },
  { value: "48.2M ֏", label: "Հավաքված 2018–2026", accent: "ink" },
  { value: "1,180+", label: "Աջակից", accent: "primary" },
  { value: "100%", label: "Ուղիղ ծրագրերին", accent: "ink" },
];

export default function StatsStrip({ stats = defaultStats }: StatsStripProps) {
  return (
    <section className="w-full my-8 md:my-10">
      <div className="bg-cream-100 rounded-[24px] px-6 md:px-10 py-8 md:py-10 grid grid-cols-2 md:grid-cols-4 gap-y-8">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={
              i > 0 ? "md:border-l md:border-cream-300 md:pl-8" : undefined
            }
          >
            <div
              className={`text-[32px] md:text-[38px] font-semibold leading-none tracking-tighter2 ${
                s.accent === "primary" ? "text-primary" : "text-ink"
              }`}
            >
              {s.value}
            </div>
            <div className="text-[13px] text-ink-muted mt-2">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
