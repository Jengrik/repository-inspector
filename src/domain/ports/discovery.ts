/**
 * Discovery Port: Pure interfaces and value objects.
 */

export interface DiscoveryOptions {
  /** Absolute path to repository root directory to be scanned. */
  rootAbsPath: string;
  /** Directory names to exclude (applied early while traversing). */
  excludedDirNames: ReadonlySet<string>;
  /** File basenames to exclude (applied before emitting). */
  excludedFileNames: ReadonlySet<string>;
}

export interface DiscoveredEntry {
  /** Normalized path (POSIX-style) relative to repository root, no leading "./". */
  relativePath: string;
}

/**
 * DiscoveryPort: lists repository files following policy and options.
 */
export interface DiscoveryPort {
  discover(options: DiscoveryOptions): Promise<ReadonlyArray<DiscoveredEntry>>;
}
