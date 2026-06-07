import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link className={`lq-brand ${className}`} href="/">
      <span className="lq-logo-shell">
        <Image
          alt="LightQuant LQ logo"
          className="lq-logo-img"
          height={44}
          priority
          src="/lightquant/lightquant-app-icon.png"
          width={44}
        />
      </span>
      <span className="lq-brand-name">LightQuant</span>
    </Link>
  );
}
