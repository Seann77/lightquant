import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type ShellNavItemProps = {
  active?: boolean;
  href: string;
  icon: string;
  label: string;
};

export function ShellNavItem({ active = false, href, icon, label }: ShellNavItemProps) {
  return (
    <Link
      className={`flex items-center gap-sm rounded-lg px-sm py-sm text-body-emphasis transition-all ${
        active
          ? "scale-[0.98] bg-paper font-bold text-primary"
          : "text-secondary hover:bg-fog hover:text-primary-bright"
      }`}
      href={href}
    >
      <MaterialIcon fill={active} size={24}>
        {icon}
      </MaterialIcon>
      <span>{label}</span>
    </Link>
  );
}
