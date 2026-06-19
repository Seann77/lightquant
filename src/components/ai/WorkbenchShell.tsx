import type { ReactNode } from "react";

type WorkbenchShellProps = {
  children: ReactNode;
  className?: string;
};

export function WorkbenchShell({
  children,
  className
}: WorkbenchShellProps) {
  return (
    <section className={["lq-task-switch-surface", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}
