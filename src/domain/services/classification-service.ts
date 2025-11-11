/**
 * ClassificationService: decides category for a given repository file.
 * Pure domain logic; no Node/FS/APIs here.
 */

import { DEFAULT_MAX_BYTES } from '../../shared/constants.js';
import type { ReaderPort, ReaderOptions } from '../ports/reader.js';
import type {
  ClassificationDecision,
  ClassifiedPath,
  OmitReason,
} from '../classification/types.js';
import { isKnownConfigByBasename, isUnderKnownConfigDir } from '../policies/config-names.js';

export interface ClassificationServiceOptions {
  /** Max file size in bytes; default 200 KB. */
  maxBytes?: number;
  /** Sample size for binary heuristic. */
  headSampleBytes?: number;
}

const DEFAULT_SAMPLE_BYTES = 4_096;

export class ClassificationService {
  private readonly maxBytes: number;
  private readonly headSampleBytes: number;

  constructor(opts?: ClassificationServiceOptions) {
    this.maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;
    this.headSampleBytes = opts?.headSampleBytes ?? DEFAULT_SAMPLE_BYTES;
  }

  /**
   * Classifies a single POSIX-relative path using a ReaderPort.
   * This method is side-effect free at the domain level; I/O is delegated to the reader.
   */
  async classifyOne(
    relativePath: string,
    reader: ReaderPort,
    readerOpts: ReaderOptions,
    binaryCheck: (buf: Uint8Array) => boolean
  ): Promise<ClassifiedPath> {
    // 1) Size filter.
    const st = await reader.stat(relativePath, readerOpts);
    if (st.sizeBytes > this.maxBytes) {
      return {
        relativePath,
        decision: { category: 'omit', reason: 'SIZE_OVER_LIMIT' },
      };
    }

    // 2) Binary heuristic (head sample).
    const head = await reader.readHead(relativePath, this.headSampleBytes, readerOpts);
    if (binaryCheck(head)) {
      return {
        relativePath,
        decision: { category: 'omit', reason: 'LIKELY_BINARY' },
      };
    }

    // 3) Static classification by name/location.
    const decision = this.classifyByName(relativePath);
    return {
      relativePath,
      decision,
    };
  }

  /**
   * Pure classification by path string (no I/O).
   * - Known config basenames and CI dirs → 'config'
   * - Otherwise → 'code'
   * Also attaches a language hint from extension (thin mapping for future use).
   */
  private classifyByName(relativePath: string): ClassificationDecision {
    const lower = relativePath.toLowerCase();

    if (isUnderKnownConfigDir(lower)) {
      return { category: 'config', languageHint: this.extToLangHint(lower) };
    }

    const base = lower.split('/').pop() ?? lower;
    if (isKnownConfigByBasename(base)) {
      return { category: 'config', languageHint: this.extToLangHint(lower) };
    }

    // Default to "code" for textual candidates.
    return { category: 'code', languageHint: this.extToLangHint(lower) };
  }

  /** Minimal extension→language mapping used later for Markdown fences. */
  private extToLangHint(p: string): string | undefined {
    if (p.endsWith('.ts')) return 'ts';
    if (p.endsWith('.tsx')) return 'tsx';
    if (p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs')) return 'js';
    if (p.endsWith('.json') || p.endsWith('.jsonc')) return 'json';
    if (p.endsWith('.yml') || p.endsWith('.yaml')) return 'yaml';
    if (p.endsWith('.md') || p.endsWith('.mdx')) return 'md';
    if (p.endsWith('.html')) return 'html';
    if (p.endsWith('.xml')) return 'xml';
    if (p.endsWith('.css')) return 'css';
    if (p.endsWith('.scss')) return 'scss';
    if (p.endsWith('.sass')) return 'sass';
    return undefined;
  }
}
