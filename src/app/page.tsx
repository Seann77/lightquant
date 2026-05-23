import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Panel } from "@/components/ui/Panel";
import { homeFeatures, homeHero } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <section className="relative flex min-h-full w-full min-w-0 flex-col items-center justify-start p-md py-12 md:justify-center md:p-xxl">
      <section className="mx-auto mb-section w-full max-w-[calc(100vw-32px)] min-w-0 text-center md:max-w-3xl">
        <h1 className="mb-sm text-[44px] font-medium leading-none tracking-tight text-ink-deep sm:text-[56px] md:text-display-xxl">
          {homeHero.title} <span className="block text-primary-bright sm:inline">{homeHero.product}</span>
        </h1>
        <p className="mx-auto w-full max-w-xl px-2 text-[18px] font-medium leading-[1.22] text-secondary sm:text-display-xs">
          {homeHero.subtitle}
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-[calc(100vw-32px)] min-w-0 grid-cols-1 justify-items-center gap-xl md:max-w-5xl md:grid-cols-3">
        {homeFeatures.map((feature) => (
          <Panel
            className="group relative h-[200px] w-[calc(100vw-32px)] max-w-full min-w-0 overflow-hidden transition-all hover:border-primary-bright/30 md:w-auto"
            key={feature.title}
          >
            <Link className="flex h-full flex-col p-xl text-left" href={feature.href}>
              <span
                className={`mb-auto flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                  feature.active
                    ? "bg-primary-soft text-primary-bright"
                    : "bg-surface-container text-ink-soft group-hover:bg-primary-soft group-hover:text-primary-bright"
                }`}
              >
                <MaterialIcon fill={feature.active} size={28}>
                  {feature.icon}
                </MaterialIcon>
              </span>

              <span className="w-full min-w-0">
                <span className="mb-xxs block text-display-xs text-ink transition-colors group-hover:text-primary-bright">
                  {feature.title}
                </span>
                <span className="block text-caption-md text-secondary">{feature.description}</span>
              </span>
            </Link>
          </Panel>
        ))}
      </section>
    </section>
  );
}
