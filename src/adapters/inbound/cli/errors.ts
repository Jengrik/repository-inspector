/**
 * CLI Errors (Inbound Adapter).
 * Defines usage errors emitted by CLI parsers and validators.
 *
 * This error type is intentionally lightweight and serializable.
 * The runner maps these reasons to exit codes and help banners.
 */

export type CliUsageReason =
  | 'FLAGS_BEFORE_COMMAND'
  | 'UNKNOWN_COMMAND'
  | 'UNKNOWN_FLAG'
  | 'MISSING_VALUE'
  | 'EXTRA_POSITIONAL';

/**
 * Represents a user-facing CLI usage error.
 * The `reason` field allows the runner to map to exit codes and guidance.
 */
export class CliUsageError extends Error {
  public readonly reason: CliUsageReason;

  constructor(message: string, reason: CliUsageReason) {
    super(message);
    this.name = 'CLI Usage Error';
    this.reason = reason;
  }
}

/**
 * Optionally: shared utility to assert exhaustiveness when switching on reasons.
 * Use inside `switch(reason)` to make TS complain on missing cases.
 */
export function assertNever(x: never): never {
  throw new Error('Unreachable case reached in CLI error handling.');
}
