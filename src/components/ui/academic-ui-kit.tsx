"use client";

import { type ReactNode } from "react";

/* ───── AcademicCard ───── */

interface AcademicCardProps {
  children: ReactNode;
  className?: string;
}

export function AcademicCard({ children, className = "" }: AcademicCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-soft ring-1 ring-black/[0.03] transition-all hover:shadow-premium dark:border-white/10 dark:bg-white/[0.02] dark:ring-white/[0.02] ${className}`}
    >
      {children}
    </div>
  );
}

interface AcademicCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AcademicCardHeader({
  title,
  subtitle,
  action,
}: AcademicCardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 dark:border-white/5">
      <div className="min-w-0">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-none">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface AcademicCardBodyProps {
  children: ReactNode;
  className?: string;
}

export function AcademicCardBody({
  children,
  className = "",
}: AcademicCardBodyProps) {
  return <div className={`px-4 py-4 sm:px-6 sm:py-5 ${className}`}>{children}</div>;
}

/* ───── StatusBadge ───── */

type BadgeTone = "emerald" | "amber" | "red" | "sky" | "zinc" | "orange" | "purple";

const badgeToneClasses: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30",
  amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/30",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30",
  sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:ring-sky-500/30",
  zinc: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:ring-zinc-500/30",
  orange: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:ring-orange-500/30",
  purple: "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:ring-purple-500/30",
};

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function StatusBadge({ label, tone = "zinc" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${badgeToneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

/* ───── MetricCard ───── */

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: BadgeTone;
}

export function MetricCard({ label, value, icon, tone = "zinc" }: MetricCardProps) {
  const borderMap: Record<BadgeTone, string> = {
    emerald: "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30",
    amber: "border-amber-100 dark:border-amber-500/20 bg-amber-50/30",
    red: "border-red-100 dark:border-red-500/20 bg-red-50/30",
    sky: "border-sky-100 dark:border-sky-500/20 bg-sky-50/30",
    zinc: "border-slate-100 dark:border-white/10 bg-slate-50/50",
    orange: "border-orange-100 dark:border-orange-500/20 bg-orange-50/30",
    purple: "border-purple-100 dark:border-purple-500/20 bg-purple-50/30",
  };

  return (
    <div
      className={`col-span-2 min-w-0 flex flex-col gap-1 rounded-2xl border px-4 py-3 shadow-sm dark:bg-white/[0.03] sm:col-span-1 ${borderMap[tone]}`}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none mt-1">{value}</div>
    </div>
  );
}

/* ───── FormField ───── */

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-bold text-red-500">{error}</p>
      ) : null}
    </div>
  );
}

/* ───── Input ───── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError, className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-11 rounded-xl border bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-4 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
        hasError
          ? "border-red-300 focus:ring-red-500/10 dark:border-red-500/50"
          : "border-slate-200 focus:border-orange-500/50 focus:ring-orange-500/10 dark:border-white/15"
      } ${className}`}
      {...props}
    />
  );
}

/* ───── Select ───── */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({ hasError, className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`h-11 rounded-xl border bg-white px-4 text-sm text-slate-900 transition-all focus:outline-none focus:ring-4 dark:bg-white/5 dark:text-white ${
        hasError
          ? "border-red-300 focus:ring-red-500/10 dark:border-red-500/50"
          : "border-slate-200 focus:border-orange-500/50 focus:ring-orange-500/10 dark:border-white/15"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

/* ───── Textarea ───── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ hasError, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`min-h-[100px] rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-4 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
        hasError
          ? "border-red-300 focus:ring-red-500/10 dark:border-red-500/50"
          : "border-slate-200 focus:border-orange-500/50 focus:ring-orange-500/10 dark:border-white/15"
      } ${className}`}
      {...props}
    />
  );
}

/* ───── Button ───── */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-600 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500 hover:shadow-orange-500/30 active:scale-95 focus:ring-orange-500/40",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:border-white/25",
  danger:
    "bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-500 hover:shadow-red-500/30 active:scale-95 focus:ring-red-500/40",
  ghost:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5",
};

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

/* ───── Modal ───── */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  bodyClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  bodyClassName = "",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-[2rem] border border-white/20 bg-white/90 shadow-premium backdrop-blur-xl dark:border-white/10 dark:bg-[#141922]/90`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/50 px-6 py-5 dark:border-white/10">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`max-h-[80vh] overflow-y-auto px-6 py-6 ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ───── EmptyState ───── */

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-slate-200 px-6 py-16 text-center dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
      {icon ? (
        <div className="mb-2 text-orange-600/50">{icon}</div>
      ) : null}
      <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{title}</h3>
      <p className="max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ───── OperationToast ───── */

interface OperationToastProps {
  message: string;
  tone: "success" | "error";
  onDismiss: () => void;
}

export function OperationToast({ message, tone, onDismiss }: OperationToastProps) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 w-[90%] sm:w-auto min-w-[280px] rounded-2xl border px-6 py-4 text-sm font-bold shadow-premium backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/90 dark:text-emerald-200"
          : "border-red-200 bg-red-50/90 text-red-900 dark:border-red-500/30 dark:bg-red-950/90 dark:text-red-200"
      }`}
    >
      <div className="flex items-center justify-between gap-4 uppercase tracking-tight">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full animate-pulse ${tone === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
          {message}
        </div>
        <button
          onClick={onDismiss}
          className="rounded-full p-1 opacity-60 hover:opacity-100 transition-all active:scale-75"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
