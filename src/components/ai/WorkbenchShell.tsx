import type { ReactNode } from "react";

export function WorkbenchShell({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={className}>{children}</section>;
}
