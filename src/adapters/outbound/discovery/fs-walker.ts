/**
 * FilesystemWalker (Outbound Adapter).
 * Iterative directory traversal that:
 * - Skips ANY symlinks (files or directories).
 * - Prunes excluded directory names early.
 * - Emits only files as normalized relative POSIX paths.
 * - Is deterministic: results sorted lexicographically by relative path.
 */

import { opendir, lstat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import type {
  DiscoveryOptions,
  DiscoveryPort,
  DiscoveredEntry,
} from '../../../domain/ports/discovery.js';
import { toPosixRelativePath } from '../../../shared/utils/paths.js';

export class FilesystemWalker implements DiscoveryPort {
  async discover(options: DiscoveryOptions): Promise<ReadonlyArray<DiscoveredEntry>> {
    const root = resolve(options.rootAbsPath);

    // Early validation
    const rootStat = await lstat(root);
    if (rootStat.isSymbolicLink()) {
      throw new Error('Root path is a symlink, which is not supported by discovery policy.');
    }
    if (!rootStat.isDirectory()) {
      throw new Error('Root path is not a directory.');
    }

    const out: DiscoveredEntry[] = [];
    const stack: string[] = [root];

    //* Adapter Helpers
    // Bind policy once; enable case-insensitive.
    const excludedDirs = options.excludedDirNames;
    const excludedFiles = options.excludedFileNames;

    const shouldExcludeDir = (name: string): boolean => excludedDirs.has(name.toLowerCase());
    const shouldExcludeFile = (name: string): boolean => excludedFiles.has(name.toLowerCase());

    // Emit file entry.
    const emitFile = (absPath: string, name: string): void => {
      if (shouldExcludeFile(name)) return;
      const rel = toPosixRelativePath(relative(root, absPath));
      out.push({ relativePath: rel });
    };

    // Enqueue directory if not excluded.
    const enqueueDir = (absPath: string, name: string) => {
      if (!shouldExcludeDir(name)) stack.push(absPath);
    };

    while (stack.length > 0) {
      const dirAbs = stack.pop()!;
      let dirHandle;
      try {
        dirHandle = await opendir(dirAbs);
      } catch {
        // Cannot open directory: Skip subtree.
        continue;
      }

      try {
        //* Iterate entries in directory.
        while (true) {
          const dirent = await dirHandle.read();
          if (!dirent) break;

          const absChild = join(dirAbs, dirent.name);

          //* Early Validation: Skip symlinks.
          if (dirent.isSymbolicLink()) {
            continue;
          }

          //* Directory: Push to stack (unless excluded).
          if (dirent.isDirectory()) {
            enqueueDir(absChild, dirent.name);
            continue;
          }

          //* File: Emit relative path.
          if (dirent.isFile()) {
            emitFile(absChild, dirent.name);
            continue;
          }

          // Fallback for unknown types.
          try {
            const st = await lstat(absChild);
            if (st.isSymbolicLink()) continue;

            if (st.isDirectory()) {
              enqueueDir(absChild, dirent.name);
              continue;
            }

            if (st.isFile()) {
              emitFile(absChild, dirent.name);
              continue;
            }
          } catch {
            continue;
          }
        }
      } finally {
        await dirHandle.close();
      }
    }

    //* Deterministic ordering.
    out.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'en', { numeric: true }));
    return out;
  }
}
