/**
 * Command Line Interface: Arguments Parser.
 * Pure parsing + shape normalization (no filesystem validation, no defaults resolution here).
 *
 * Supported:
 *   repository-inspector generate [--repo <path>] [--out <dir>] [--debug] [--help]
 *   repository-inspector generate --help
 *   repository-inspector help
 *
 * Rules:
 * - No flags are allowed before the command. If a flag appears before the command, throw an error.
 * - Unknown flags cause a hard error (fail-fast).
 * - Flags requiring a value (--repo, --out) must receive one (next token cannot be a flag or missing).
 * - Positional arguments after the command are not allowed (Stage 1).
 * - Defaults (e.g., repo/out -> cwd) are NOT resolved here; leave them undefined for the use case layer.
 * - Root-level "--help" (i.e., before any command) is NOT supported in Stage 1; use the "help" command instead.
 */

import { CliUsageError } from './errors.js';
export type CliCommand = 'generate' | 'help';

export interface ParsedArgs {
  command: CliCommand;
  options: {
    repo?: string;
    out?: string;
    debug: boolean;
    help: boolean;
  };
}

export const HELP_BANNER_ROOT = `repository-inspector

Usage:
  repository-inspector generate [--repo <path>] [--out <dir>] [--debug] [--help]
  repository-inspector help

Notes:
  Use "repository-inspector generate --help" for command-specific help.
`;

export const HELP_BANNER_GENERATE = `repository-inspector generate

Usage:
  repository-inspector generate [--repo <path>] [--out <dir>] [--debug] [--help]

Options:
  --repo   Target repository path (optional).
  --out    Output directory for artifacts (optional).
  --debug  Enables debug logging (flag).
  --help   Displays this help message for 'generate'.
`;

const FLAGS = {
  REPO: '--repo',
  OUT: '--out',
  DEBUG: '--debug',
  HELP: '--help',
} as const;

/**
 * Parses process.argv into a normalized shape for the supported commands.
 *
 * Rules:
 * - Flags before command → error.
 * - Supported commands: "generate", "help".
 * - "help" command accepts no extra args.
 * - "generate" supports flags: --repo <path>, --out <dir>, --debug, --help.
 * - Unknown flags or unexpected positionals → error.
 *
 * @throws {CliUsageError} If a constraint is violated.
 */
export function parseArgv(argv: readonly string[]): ParsedArgs {
  let rest = argv.slice(2);

  // Accept a leading `--` separator injected by script runners (pnpm/npm/yarn).
  if (rest[0] === '--') {
    rest = rest.slice(1);
  }

  if (rest.length === 0) {
    // No command specified → treat as top-level help command.
    return { command: 'help', options: { help: false, debug: false } };
  }

  // Enforce: First token MUST be the command; flags cannot appear before it.
  const command = rest[0];
  if (command && command.startsWith('-')) {
    throw new CliUsageError(
      `Flags cannot appear before a command. Use "help" or "generate" as the first argument.`,
      'FLAGS_BEFORE_COMMAND'
    );
  }

  const opts: ParsedArgs['options'] = { help: false, debug: false };
  switch (command) {
    case 'generate':
      // Handle the "generate" command - parse flags after the command
      for (let i = 1; i < rest.length; i++) {
        const flag = rest[i];

        if (flag && !flag.startsWith('-')) {
          throw new CliUsageError(
            `Unexpected argument "${flag}". Use flags only after the command.`,
            'EXTRA_POSITIONAL'
          );
        }

        switch (flag) {
          case FLAGS.HELP: {
            opts.help = true;
            break;
          }
          case FLAGS.DEBUG: {
            opts.debug = true;
            break;
          }
          case FLAGS.REPO: {
            const value = rest[++i];
            if (!value || value.startsWith('-')) {
              throw new CliUsageError(`Flag "${FLAGS.REPO}" requires a value.`, 'MISSING_VALUE');
            }
            opts.repo = value;
            break;
          }
          case FLAGS.OUT: {
            const value = rest[++i];
            if (!value || value.startsWith('-')) {
              throw new CliUsageError(`Flag "${FLAGS.OUT}" requires a value.`, 'MISSING_VALUE');
            }
            opts.out = value;
            break;
          }
          default: {
            throw new CliUsageError(`Unknown flag "${flag}".`, 'UNKNOWN_FLAG');
          }
        }
      }
      break;
    case 'help':
      // Handle the "help" command.
      if (rest.length > 1) {
        throw new CliUsageError(
          `Command "help" does not accept additional arguments.`,
          'EXTRA_POSITIONAL'
        );
      }
      return { command: 'help', options: { help: false, debug: false } };
    default: {
      throw new CliUsageError(
        `Unknown command "${command}". Supported commands: "generate", "help".`,
        'UNKNOWN_COMMAND'
      );
    }
  }

  return {
    command: 'generate',
    options: {
      ...(typeof opts.repo === 'string' ? { repo: opts.repo } : {}),
      ...(typeof opts.out === 'string' ? { out: opts.out } : {}),
      debug: opts.debug === true,
      help: opts.help === true,
    },
  };
}
