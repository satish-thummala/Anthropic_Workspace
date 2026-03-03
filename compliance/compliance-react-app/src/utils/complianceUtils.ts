import { FRAMEWORKS } from '../constants/mockData';
import type { Framework } from '../types/compliance.types';

export function coveragePct(fw: Framework): number {
  return Math.round((fw.covered / fw.controls) * 100);
}

export function overallScore(): number {
  return Math.round(
    FRAMEWORKS.reduce((acc, fw) => acc + coveragePct(fw), 0) / FRAMEWORKS.length
  );
}
