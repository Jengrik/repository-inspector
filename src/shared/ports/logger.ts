/**
 * Logger Port.
 * Provides a minimal and strongly-typed logging abstraction decoupled from any specific sink.
 * This port is designed for hexagonal architecture to keep the domain/application pure.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

export interface LoggerOptions {
  /** Enables or disables debug-level logs at runtime. */
  debugEnabled?: boolean;
  /** Enables or disables ANSI colors at runtime. */
  colorsEnabled?: boolean;
  /** Optional scope label to categorize messages (e.g., "CLI", "UseCase"). */
  scope?: string;
  /** When true, prepend timestamps to messages (local time, HH:MM:SS). */
  timestamps?: boolean;
}

/**
 * LoggerPort defines a minimal surface for structured, leveled logging.
 * Implementations may choose how to format and where to route messages.
 */
export interface LoggerPort {
  /** Enable or disable debug logs. */
  setDebug(enabled: boolean): void;

  /** Enable or disable ANSI color output. */
  setColors(enabled: boolean): void;

  /** Returns a lightweight scoped logger (non-owning view on the same sink/state). */
  withScope(scope: string): LoggerPort;

  /** Generic log entry with explicit level. */
  log(level: LogLevel, message: string): void;

  /** Convenience methods for common levels. */
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  success(message: string): void;
}
