/**
 * Path utilities. These helpers are pure and cross-platform oriented.
 */

import { posix } from 'node:path';

/** Normalizes to POSIX-style separators and removes leading "./". */
export function toPosixRelativePath(relPath: string): string {
  // Replace backslashes and collapse duplicate slashes.
  const replaced = relPath.replace(/\\/g, '/').replace(/\/+/g, '/');
  return replaced.replace(/^(\.\/)+/, '');
}

/** Joins POSIX segments deterministically (used for anchors and sorting). */
export function joinPosix(...parts: string[]): string {
  return posix.join(...parts);
}
