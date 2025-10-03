import { ConsoleLogger } from './adapters/outbound/logging/console-logger.js';

const rootLogger = new ConsoleLogger({ scope: 'CLI', timestamps: true });

/**
 * Process entry point for the repository-inspector CLI.
 * Keeps top-level side effects confined to this file.
 */
import { runCli } from './adapters/inbound/cli/runner.js';

const code = await runCli(process.argv, rootLogger);
process.exit(code);
