/**
 * Default filesystem exclusion policies (domain-level).
 * Pure, platform-agnostic; no Node.js dependencies.
 */

/** Canonical directory names (original casing for readability). */
export const DEFAULT_EXCLUDED_DIR_NAMES: readonly string[] = [
  '.git',
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.vercel',
  '.turbo',
  'coverage',
  '.nyc_output',
  '.idea',
  '.vscode',
  'venv',
  '.venv',
  // Rush and PNPM
  'common/autoinstallers',
  'pnpm-store',
  'temp',
] as const;

/** Canonical file names to ignore at discovery time. */
export const DEFAULT_EXCLUDED_FILE_NAMES: readonly string[] = ['.DS_Store', 'Thumbs.db'] as const;

/** Builds a lowercase set for case-insensitive directory membership checks. */
export function buildExcludedDirNameSetLower(): ReadonlySet<string> {
  return new Set(DEFAULT_EXCLUDED_DIR_NAMES.map((s) => s.toLowerCase()));
}

/** Builds a lowercase set for case-insensitive file membership checks. */
export function buildExcludedFileNameSetLower(): ReadonlySet<string> {
  return new Set(DEFAULT_EXCLUDED_FILE_NAMES.map((s) => s.toLowerCase()));
}
