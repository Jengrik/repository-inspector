/**
 * CLI Runner.
 * Connects the CLI parser with logging and prints contextual help.
 * It maps usage/runtime errors to exit codes and keeps the domain
 * isolated from process.* concerns. For Stage-1, it logs parameters
 * directly (Hello World) without invoking application use cases.
 */

import { parseArgv, HELP_BANNER_ROOT, HELP_BANNER_GENERATE } from './parse-args.js';
import { assertNever, CliUsageError } from './errors.js';
import { ConsoleLogger } from '../../outbound/logging/console-logger.js';
import { generateReport } from '../../../application/use-cases/generate-report.js';

import type { LoggerPort } from '../../../shared/ports/logger.js';

export const EXIT_CODES = {
  OK: 0, // success (with or without skipped files)
  USAGE: 2, // CLI usage errors (invalid flags, etc.)
  RUNTIME: 3, // runtime errors not attributable to user input
} as const;

/** Prints the appropriate help banner based on a usage error reason. */
function printHelpForReason(reason: CliUsageError['reason'], logger: LoggerPort): void {
  switch (reason) {
    case 'FLAGS_BEFORE_COMMAND':
    case 'UNKNOWN_COMMAND': {
      logger.info(HELP_BANNER_ROOT);
      return;
    }
    case 'UNKNOWN_FLAG':
    case 'MISSING_VALUE':
    case 'EXTRA_POSITIONAL': {
      logger.info(HELP_BANNER_GENERATE);
      return;
    }
    default:
      assertNever(reason as never);
  }
}

/**
 * Runs the CLI and returns an exit code without calling process.exit.
 * Accepts an optional logger for testing; defaults to ConsoleLogger.
 */
export async function runCli(
  argv: readonly string[],
  injectedLogger?: LoggerPort
): Promise<number> {
  // Build a root logger. Debug level is set after parsing flags.
  const rootLogger: LoggerPort =
    injectedLogger ?? new ConsoleLogger({ scope: 'CLI', timestamps: true });

  try {
    const parsed = parseArgv(argv);

    // Enable debug after flags are known.
    rootLogger.setDebug(parsed.options.debug === true);

    switch (parsed.command) {
      case 'help': {
        rootLogger.info(HELP_BANNER_ROOT);
        return EXIT_CODES.OK;
      }

      case 'generate': {
        // `repository-inspector generate --help`
        if (parsed.options.help) {
          rootLogger.info(HELP_BANNER_GENERATE);
          return EXIT_CODES.OK;
        }

        //! Stage-1 "Hello World": print parsed options.
        await generateReport(
          {
            repo: parsed.options.repo,
            out: parsed.options.out,
            debug: parsed.options.debug,
          },
          rootLogger
        );
        return EXIT_CODES.OK;
      }
    }
  } catch (err) {
    if (err instanceof CliUsageError) {
      rootLogger.error(err.message);
      printHelpForReason(err.reason, rootLogger);
      return EXIT_CODES.USAGE;
    }

    // Unexpected runtime error: map to exit code 3 and print a single diagnostic.
    const unknown = err as Error;
    rootLogger.error(unknown?.stack ?? `Unexpected error: ${String(unknown)}`);
    return EXIT_CODES.RUNTIME;
  }
}
