/**
 * Console Logger Adapter.
 * A robust console-based LoggerPort implementation with:
 * - ANSI colors/styles (16-color SGR, bold/dim/underline/italic),
 * - TTY/NO_COLOR/FORCE_COLOR awareness,
 * - Scoped child loggers,
 * - Timestamp and level prefixes,
 * - stdout (info/debug/success) and stderr (warn/error) routing.
 *
 * Notes:
 * - This adapter intentionally keeps formatting deterministic and lightweight.
 * - It avoids any external dependency to preserve small surface and testability.
 */

import type { LogLevel, LoggerOptions, LoggerPort } from '../../../shared/ports/logger.js';

/** Minimal ANSI SGR codes (foreground only + common styles). */
const enum SGR {
  Reset = '\x1b[0m',
  Bold = '\x1b[1m',
  Dim = '\x1b[2m',
  Italic = '\x1b[3m',
  Underline = '\x1b[4m',

  Red = '\x1b[31m',
  Green = '\x1b[32m',
  Yellow = '\x1b[33m',
  Blue = '\x1b[34m',
  Magenta = '\x1b[35m',
  Cyan = '\x1b[36m',
  White = '\x1b[37m',
  Gray = '\x1b[90m',
}

/** Returns true if ANSI colors should be used given environment and TTY. */
function detectColorSupport(): boolean {
  // Respect NO_COLOR; avoid color when stdout is not a TTY (typical CI piping).
  if (!process.stdout.isTTY) return false;
  if (process.env['NO_COLOR']) return false;
  // FORCE_COLOR enables color even in atypical environments.
  if (process.env['FORCE_COLOR']) return true;
  return true;
}

/** Conditionally colorizes text with the provided SGR codes. */
function paint(text: string, enabled: boolean, ...codes: string[]): string {
  if (!enabled) return text;
  return codes.join('') + text + SGR.Reset;
}

/** Formats a simple HH:MM:SS timestamp string. */
function formatTime(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** Aligns multiline messages so subsequent lines line up beneath the first. */
function indentMultiline(text: string, prefixLength: number): string {
  if (!text.includes('\n')) return text;
  const pad = ' '.repeat(prefixLength);
  return text
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : pad + line))
    .join('\n');
}

/** Mapping from log level to label and style. */
const LEVEL_STYLE: Record<
  LogLevel,
  { style: (s: string, colors: boolean) => string; toStderr: boolean }
> = {
  info: {
    style: (s, c) => paint(s, c, SGR.Cyan),
    toStderr: false,
  },
  warn: {
    style: (s, c) => paint(s, c, SGR.Yellow, SGR.Bold),
    toStderr: true,
  },
  error: {
    style: (s, c) => paint(s, c, SGR.Red, SGR.Bold),
    toStderr: true,
  },
  debug: {
    style: (s, c) => paint(s, c, SGR.Magenta, SGR.Dim),
    toStderr: false,
  },
  success: {
    style: (s, c) => paint(s, c, SGR.Green, SGR.Bold),
    toStderr: false,
  },
};

export class ConsoleLogger implements LoggerPort {
  /** Shared state so child scopes remain consistent. */
  private state: {
    debugEnabled: boolean;
    colorsEnabled: boolean;
    timestamps: boolean;
  };

  /** Optional scope label for this instance (lightweight view on shared state). */
  private readonly scope?: string | undefined;

  constructor(options?: LoggerOptions) {
    this.state = {
      debugEnabled: options?.debugEnabled ?? false,
      colorsEnabled:
        typeof options?.colorsEnabled === 'boolean' ? options.colorsEnabled : detectColorSupport(),
      timestamps: options?.timestamps ?? true,
    };
    this.scope = options?.scope;
  }

  setDebug(debug: boolean): void {
    this.state.debugEnabled = debug === true;
  }

  setColors(colors: boolean): void {
    this.state.colorsEnabled = colors === true;
  }

  withScope(scope: string): LoggerPort {
    // Return a lightweight view sharing the same internal state.
    const child = new ConsoleLogger({
      debugEnabled: this.state.debugEnabled,
      colorsEnabled: this.state.colorsEnabled,
      timestamps: this.state.timestamps,
      scope,
    });
    // Share the same state object so changes (e.g., setDebug) propagate.
    (child as ConsoleLogger).state = this.state;
    return child;
  }

  log(level: LogLevel, message: string): void {
    if (level === 'debug' && !this.state.debugEnabled) return;

    const { style, toStderr } = LEVEL_STYLE[level];
    const parts: string[] = [];

    // Timestamp prefix.
    if (this.state.timestamps) {
      const ts = formatTime(new Date());
      parts.push(paint(`[${ts}]`, this.state.colorsEnabled, SGR.Dim));
    }

    // Scope prefix (if any).
    if (this.scope) {
      const decoratedScope = paint(
        `[ ${this.scope} ]`,
        this.state.colorsEnabled,
        SGR.Bold,
        SGR.Blue
      );
      parts.push(decoratedScope);
    }

    // Build prefix and multiline alignment safely.
    const prefix = parts.join(' ');
    const sep = prefix ? ' ' : '';
    const aligned = indentMultiline(message, prefix.length + (sep ? 1 : 0));
    const line = `${prefix}${sep}${style(aligned, this.state.colorsEnabled)}`;

    if (toStderr) {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  info(message: string): void {
    this.log('info', message);
  }

  warn(message: string): void {
    this.log('warn', message);
  }

  error(message: string): void {
    this.log('error', message);
  }

  debug(message: string): void {
    this.log('debug', message);
  }

  success(message: string): void {
    this.log('success', message);
  }
}
