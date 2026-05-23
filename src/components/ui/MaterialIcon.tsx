import type { CSSProperties } from "react";

type MaterialIconProps = {
  children: string;
  className?: string;
  fill?: boolean;
  size?: number;
};

export function MaterialIcon({ children, className = "", fill = false, size }: MaterialIconProps) {
  const style: CSSProperties = {
    fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0"
  };

  if (size) {
    style.fontSize = `${size}px`;
  }

  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`} style={style}>
      {children}
    </span>
  );
}
