import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ className = "", id, label, ...props }: TextFieldProps) {
  const inputId = id ?? props.name ?? label;

  return (
    <label className="grid gap-xs text-caption-bold text-on-surface" htmlFor={inputId}>
      {label}
      <input
        className={`h-11 rounded border border-steel bg-paper px-sm text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
        id={inputId}
        {...props}
      />
    </label>
  );
}
