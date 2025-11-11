/**
 * Domain types for initial file classification.
 */

export type FileCategory = 'code' | 'config' | 'omit';

export type OmitReason = 'SIZE_OVER_LIMIT' | 'LIKELY_BINARY' | 'READ_ERROR' | 'UNKNOWN_ENCODING';

export interface ClassificationDecision {
  category: FileCategory;
  /** Reason is defined only when category === 'omit'. */
  reason?: OmitReason;
  /** Resolved hint from extension (for future Markdown fences). */
  languageHint?: string | undefined;
}

export interface ClassifiedPath {
  /** POSIX-style path relative to repository root. */
  relativePath: string;
  decision: ClassificationDecision;
}
