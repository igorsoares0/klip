const STATS = [
  { value: "38ms", label: "Median redirect" },
  { value: "100k", label: "Clicks / month" },
  { value: "$89", label: "One-time" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
      <div className="flex items-center justify-center bg-canvas px-10 py-12">
        <div className="w-full max-w-auth">{children}</div>
      </div>

      <div className="flex flex-col justify-center gap-7 bg-ink px-11 py-12">
        <p className="font-mono text-[11px] font-semibold tracking-eyebrow text-lime uppercase">
          Short link → Tracking → Optimization
        </p>
        <h2 className="text-display font-bold tracking-tighter text-white">
          Every link you share, measured down to the city and the device.
        </h2>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-metric-sm font-bold tracking-tighter text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-[11.5px] text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
        <blockquote className="border-t border-white/12 pt-7 text-body text-white/70">
          “We moved 4,000 links over in an afternoon. The analytics finally tell
          us which creator actually drives sales.”
          <footer className="mt-3 text-meta text-white/40">
            Growth lead · Acme
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
