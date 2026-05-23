import type { HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Panel({ children, className = "", ...props }: PanelProps) {
  return (
    <div className={`rounded-xl border border-surface-container-high bg-paper shadow-soft-lift ${className}`} {...props}>
      {children}
    </div>
  );
}
