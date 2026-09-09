import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { AlertIcon, CheckIcon } from "@/components/icons";

export function Label({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-label font-medium text-ink-secondary", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  mono?: boolean;
}

export function Input({ className, invalid, mono, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-input border bg-surface px-3 text-body text-ink transition-colors",
        mono && "font-mono",
        invalid
          ? "border-danger"
          : "border-border-strong hover:border-border-hover",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full cursor-pointer appearance-none rounded-input border border-border-strong bg-surface px-3 text-body text-ink transition-colors hover:border-border-hover",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label?: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {hint}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-[6px] text-caption text-danger">
      <AlertIcon size={13} />
      {children}
    </p>
  );
}

export function FieldSuccess({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-[6px] text-caption text-positive">
      <CheckIcon size={13} />
      {children}
    </p>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-pill p-[2px] transition-colors",
        checked ? "bg-accent" : "bg-disabled-bg",
      )}
    >
      <span
        className="block h-[18px] w-[18px] rounded-pill bg-white transition-transform duration-150"
        style={{ transform: `translateX(${checked ? 16 : 0}px)` }}
      />
    </button>
  );
}
