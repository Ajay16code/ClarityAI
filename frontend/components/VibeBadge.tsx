
import React from 'react';
import { VibeCategory } from '../types';

interface VibeBadgeProps {
  category: VibeCategory;
  summary: string; // Full summary for tooltip
  className?: string;
}

const getVibeColor = (category: VibeCategory) => {
  switch (category) {
    case VibeCategory.POSITIVE:
      return 'bg-[var(--color-vibe-positive-bg)] text-[var(--color-vibe-positive-text)]';
    case VibeCategory.NEGATIVE:
      return 'bg-[var(--color-vibe-negative-bg)] text-[var(--color-vibe-negative-text)]';
    case VibeCategory.NEUTRAL:
      return 'bg-[var(--color-vibe-neutral-bg)] text-[var(--color-vibe-neutral-text)]';
    case VibeCategory.MIXED:
      return 'bg-[var(--color-vibe-mixed-bg)] text-[var(--color-vibe-mixed-text)]';
    case VibeCategory.UNKNOWN:
    default:
      return 'bg-[var(--color-vibe-unknown-bg)] text-[var(--color-vibe-unknown-text)]';
  }
};

const VibeBadge: React.FC<VibeBadgeProps> = ({ category, summary, className }) => {
  const colorClasses = getVibeColor(category);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClasses} ${className} relative group`}
      title={summary} // Tooltip for full summary
      style={{ fontFamily: 'inherit' }}
    >
      {category}
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 p-2 bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-40 whitespace-normal">
        {summary}
      </span>
    </span>
  );
};

export default VibeBadge;
