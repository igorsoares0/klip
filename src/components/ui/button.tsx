import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger" | "lime";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-white border border-transparent hover:bg-ink-hover disabled:bg-disabled-bg disabled:text-disabled-fg disabled:cursor-not-allowed",
  outline:
    "bg-surface text-ink border border-border-strong hover:border-border-hover",
  ghost: "bg-transparent text-muted border border-transparent hover:bg-surface-muted",
  danger:
    "bg-transparent text-danger border border-border-danger hover:bg-danger-bg",
  lime: "bg-lime text-ink border border-transparent hover:brightness-95",
};

const SIZES: Record<Size, string> = {
  sm: "h-[30px] px-3 text-meta",
  md: "h-[34px] px-4 text-[13px]",
  lg: "h-[42px] px-5 text-body",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Stretch to the container width — used by the auth and onboarding CTAs. */
  block?: boolean;
}

/** Every button in this design carries `white-space: nowrap`: the layout is
 *  dense and labels must not wrap inside fixed-height controls. */
export function Button({
  variant = "outline",
  size = "md",
  icon,
  block,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-nav font-semibold whitespace-nowrap transition-colors cursor-pointer",
        "disabled:cursor-not-allowed disabled:text-disabled-fg disabled:hover:border-border-strong",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-chip text-faint transition-colors cursor-pointer hover:bg-surface-muted hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
