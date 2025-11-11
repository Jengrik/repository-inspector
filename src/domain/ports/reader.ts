/**
 * ReaderPort: abstraction to read file stats and contents.
 * All methods receive POSIX-style relative paths rooted at repository base (adapter resolves them).
 */

export interface FileStat {
  sizeBytes: number;
}

export interface ReaderOptions {
  /** Absolute path to repository root. */
  rootAbsPath: string;
  /** Max bytes allowed per file; defaults may be applied by use case/service. */
  maxBytes: number;
}

export interface ReaderPort {
  /** Returns stat info, including size. */
  stat(relPath: string, opts: ReaderOptions): Promise<FileStat>;

  /** Reads at most `n` bytes from the file start (for binary heuristics). */
  readHead(relPath: string, n: number, opts: ReaderOptions): Promise<Uint8Array>;

  /**
   * Reads full text (UTF-8) and normalizes line endings to LF.
   * Implementations must throw on decoding errors; the domain will map them to omit reasons.
   */
  readTextNormalized(relPath: string, opts: ReaderOptions): Promise<string>;
}
