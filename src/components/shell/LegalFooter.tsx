"use client";

import { usePathname } from "next/navigation";

export function LegalFooter() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <footer className="lq-legal-footer">
      <p>
        <span className="lq-legal-footer-risk">AI 生成策略需自行回测验证，投资有风险，请谨慎使用。</span>
        {isHomePage ? (
          <span className="lq-legal-footer-home-meta">
            <span aria-hidden="true" className="lq-legal-footer-separator">·</span>
            <span>© 2026 LightQuant</span>
            <span aria-hidden="true" className="lq-legal-footer-separator">·</span>
            <a href="https://beian.miit.gov.cn/" rel="noopener noreferrer" target="_blank">
              浙ICP备2026040091号
            </a>
          </span>
        ) : null}
      </p>
    </footer>
  );
}
