/**
 * Binary detection heuristics.
 * Pure utilities relying on ASCII ranges and NUL bytes presence.
 */

const ASCII_PRINTABLE_MIN = 0x20; // ' '
const ASCII_PRINTABLE_MAX = 0x7e; // '~'
const ASCII_COMMON_WHITESPACE = new Set<number>([0x09, 0x0a, 0x0d]); // \t \n \r

export interface BinaryHeuristicOptions {
  /** If any NUL byte is present, consider binary immediately. */
  treatNulAsBinary: boolean;
  /** Ratio threshold of non-printable bytes above which we consider binary. Range: 0..1 */
  nonPrintableThreshold: number;
}

/**
 * Returns true when the provided sample buffer is likely binary.
 */
export function isLikelyBinary(
  sample: Uint8Array,
  opts: BinaryHeuristicOptions = { treatNulAsBinary: true, nonPrintableThreshold: 0.3 }
): boolean {
  if (sample.length === 0) return false;

  let nonPrintable = 0;

  for (const b of sample) {
    if (opts.treatNulAsBinary && b === 0x00) return true;

    const printable =
      (b >= ASCII_PRINTABLE_MIN && b <= ASCII_PRINTABLE_MAX) || ASCII_COMMON_WHITESPACE.has(b);

    if (!printable) nonPrintable++;
  }

  const ratio = nonPrintable / sample.length;
  return ratio > opts.nonPrintableThreshold;
}
