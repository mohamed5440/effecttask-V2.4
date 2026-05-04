import React from "react";
import { cn } from "../../lib/utils";
import { getStatusLabel, getStatusColors, formatDuration } from "../../lib/formatters";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <span
      className={cn(
        "px-2.5 py-1 text-[10px] sm:text-[11px] font-black rounded-lg whitespace-nowrap inline-flex items-center justify-center",
        getStatusColors(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
};

interface DurationBadgeProps {
  duration: string | number;
  className?: string;
}

export const DurationBadge: React.FC<DurationBadgeProps> = ({ duration, className }) => {
  if (!duration) return null;
  
  return (
    <span className={cn(
      "flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg whitespace-nowrap border border-zinc-100",
      className
    )}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {formatDuration(duration)}
    </span>
  );
};
