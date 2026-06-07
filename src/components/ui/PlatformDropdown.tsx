"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

type PlatformDropdownProps = {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  tone?: "default" | "target";
  value: string;
};

export function PlatformDropdown({ className = "", label, onChange, options, tone = "default", value }: PlatformDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.indexOf(value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveIndex(selectedIndex);

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, selectedIndex]);

  function commitSelection(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        if (!open) {
          return selectedIndex;
        }

        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (current + direction + options.length) % options.length;
      });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (open) {
        commitSelection(options[activeIndex] ?? value);
        return;
      }

      setOpen(true);
    }
  }

  return (
    <div className={`lq-select ${open ? "is-open" : ""} ${tone === "target" ? "is-target" : ""} ${className}`} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="lq-select-trigger"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="lq-select-label">{label}</span>
        <span className="lq-select-current">
          <span className="lq-select-value">{value}</span>
          <ChevronDown aria-hidden="true" className="lq-select-caret" size={16} />
        </span>
      </button>

      {open ? (
        <div className="lq-select-menu" id={listboxId} role="listbox" tabIndex={-1}>
          {options.map((option, index) => {
            const selected = option === value;
            const active = index === activeIndex;

            return (
              <button
                aria-selected={selected}
                className={`lq-select-option ${selected ? "is-selected" : ""} ${active ? "is-active" : ""}`}
                key={option}
                onClick={() => commitSelection(option)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <span>{option}</span>
                {selected ? <Check aria-hidden="true" size={15} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
