import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Code2, Repeat2, Sparkles, type LucideIcon } from "lucide-react";
import { homeFeatures, homeHero } from "@/lib/mock-data";

const featureIcons: Record<string, LucideIcon> = {
  auto_awesome: Sparkles,
  code: Code2,
  translate: Repeat2
};

export default function HomePage() {
  return (
    <section className="lq-home-page">
      <div className="lq-home-content-group">
        <section className="lq-home-hero">
          <div className="lq-ai-badge">
            <Image alt="" height={24} src="/lightquant/lightquant-app-icon.png" width={24} />
            <span>LightQuant AI Platform</span>
          </div>
          <h1>
            {homeHero.title} <span>{homeHero.product}</span>
          </h1>
          <p>{homeHero.subtitle.replace("——", "与").replace(" 相互转化", "相互转化")}</p>
          <div className="lq-home-support-pill">
            <Sparkles aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>支持 PTrade、聚宽、QMT 策略代码</span>
          </div>
        </section>

        <section aria-label="功能入口" className="lq-home-cards">
          {homeFeatures.map((feature) => {
            const Icon = featureIcons[feature.icon] ?? Sparkles;

            return (
              <Link className="lq-feature-card" href={feature.href} key={feature.title}>
                <span className="lq-icon-button lq-feature-card-arrow">
                  <ArrowUpRight aria-hidden="true" size={18} />
                </span>
                <span className="lq-feature-card-icon">
                  <Icon aria-hidden="true" size={25} strokeWidth={1.8} />
                </span>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </section>
  );
}
