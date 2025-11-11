/**
 * FSReader adapter: implements ReaderPort via Node.js filesystem.
 * Resolves absolute paths from {rootAbsPath}+relative POSIX path.
 */

import { resolve, posix } from 'node:path';
import { readFile, stat, open } from 'node:fs/promises';
import type { ReaderOptions, ReaderPort, FileStat } from '../../../domain/ports/reader.js';

export class FSReader implements ReaderPort {
  private resolveAbs(relPosix: string, opts: ReaderOptions): string {
    // Compose using POSIX path segments to avoid backslash confusion in rel path.
    // Then resolve against absolute root.
    const joined = posix.normalize(relPosix);
    return resolve(opts.rootAbsPath, joined);
  }

  async stat(relPath: string, opts: ReaderOptions): Promise<FileStat> {
    const abs = this.resolveAbs(relPath, opts);
    const s = await stat(abs);
    return { sizeBytes: s.size };
  }

  async readHead(relPath: string, n: number, opts: ReaderOptions): Promise<Uint8Array> {
    const abs = this.resolveAbs(relPath, opts);
    const fh = await open(abs, 'r');
    try {
      const buf = new Uint8Array(n);
      const { bytesRead } = await fh.read(buf, 0, n, 0);
      return bytesRead === n ? buf : buf.subarray(0, bytesRead);
    } finally {
      await fh.close();
    }
  }

  async readTextNormalized(relPath: string, opts: ReaderOptions): Promise<string> {
    const abs = this.resolveAbs(relPath, opts);
    const buf = await readFile(abs);
    // UTF-8 decoding; if it fails, Node throws and caller maps to reason.
    const text = buf.toString('utf8');
    // Normalize CRLF -> LF to keep deterministic Markdown.
    return text.replace(/\r\n/g, '\n');
  }
}
