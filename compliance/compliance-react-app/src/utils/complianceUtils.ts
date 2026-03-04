import type { Framework, ApiFrameworkSummary } from '../types/compliance.types';

export function coveragePct(fw: Framework): number {
  if (!fw.controls) return 0;
  return Math.round((fw.covered / fw.controls) * 100);
}

export function overallScore(frameworks: Framework[]): number {
  if (!frameworks.length) return 0;
  return Math.round(
    frameworks.reduce((acc, fw) => acc + coveragePct(fw), 0) / frameworks.length
  );
}

/** Same as coveragePct but works directly on API summaries */
export function apiCoveragePct(fw: ApiFrameworkSummary): number {
  return fw.coveragePercentage ?? 0;
}
