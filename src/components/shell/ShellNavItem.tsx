import Link from "next/link";
import { Code2, Grid2X2, Repeat2, Sparkles, type LucideIcon } from "lucide-react";

type ShellNavItemProps = {
  active?: boolean;
  href: string;
  icon: string;
  label: string;
};

const iconMap: Record<string, LucideIcon> = {
  auto_awesome: Sparkles,
  code: Code2,
  grid_view: Grid2X2,
  translate: Repeat2
};

export function ShellNavItem({ active = false, href, icon, label }: ShellNavItemProps) {
  const Icon = iconMap[icon] ?? Sparkles;

  return (
    <Link
      className={`lq-nav-item ${active ? "is-active" : ""}`}
      href={href}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
