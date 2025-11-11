/**
 * Static rules for recognizing configuration/metadata files.
 * These tables are intentionally conservative and extensible.
 */

export const CONFIG_BASENAMES: ReadonlySet<string> = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.npmrc',
  '.nvmrc',
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.gitmodules',
  '.env',
  '.env.local',
  '.env.example',
  'tsconfig.json',
  'jsconfig.json',
  // common tools:
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.json',
  '.prettierignore',
  'prettier.config.js',
  'prettier.config.cjs',
  'jest.config.js',
  'jest.config.cjs',
  'vitest.config.ts',
  'vitest.config.js',
  'webpack.config.js',
  'rollup.config.js',
  'vite.config.ts',
  'vite.config.js',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
]);

/** Directories whose content is typically configuration/CI pipelines. */
export const CONFIG_DIR_PREFIXES: ReadonlyArray<string> = [
  '.github/',
  '.gitlab/',
  '.circleci/',
  '.husky/',
];

/** Quick check for known config basenames. */
export function isKnownConfigByBasename(basenameLower: string): boolean {
  return CONFIG_BASENAMES.has(basenameLower);
}

/** Quick check for known config directories. */
export function isUnderKnownConfigDir(posixRelPathLower: string): boolean {
  return CONFIG_DIR_PREFIXES.some((p) => posixRelPathLower.startsWith(p));
}
