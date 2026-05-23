import Link from "next/link";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link className={`flex min-w-0 items-center gap-xs ${className}`} href="/">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-on-primary shadow-soft-lift">
        <span className="text-caption-bold leading-none">A</span>
      </span>
      <span className="truncate text-display-xs font-bold text-ink">LightQuant</span>
    </Link>
  );
}
