import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "ink" | "paper" | "light-outline";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "border border-primary bg-primary text-on-primary hover:bg-primary-deep",
  outline: "border border-primary bg-paper text-primary hover:bg-primary-soft",
  ghost: "border border-transparent bg-transparent text-secondary hover:bg-surface-container hover:text-primary",
  ink: "border border-ink bg-ink text-on-primary hover:bg-charcoal",
  paper: "border border-paper bg-paper text-ink hover:bg-cloud",
  "light-outline": "border border-steel bg-transparent text-paper hover:bg-white/10"
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-sm text-button-sm",
  md: "h-11 px-xl text-button-md"
};

export function Button({ children, className = "", size = "md", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-xs rounded font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
