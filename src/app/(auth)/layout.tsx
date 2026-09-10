import { CLICK_LIMIT } from "@/entitlements/limits";
import { compactNumber } from "@/shared/format";

/**
 * Facts about the product, each one true today. The design had a median
 * redirect time nobody has measured, a price the code should not be deciding,
 * and a customer quote from a customer that does not exist — on the one page
 * every visitor sees before signing up.
 */
const STATS = [
  { value: compactNumber(CLICK_LIMIT), label: "Tracked clicks / month" },
  { value: "PNG · SVG", label: "QR codes" },
  { value: "CSV", label: "Analytics export" },
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
      </div>
    </div>
  );
}
