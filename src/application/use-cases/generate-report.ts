/**
 * GenerateReportUseCase (Stage 1 - Demo).
 * Prints the parsed options as a placeholder for future orchestration.
 * This keeps application behavior testable and independent of CLI specifics.
 */
import type { LoggerPort } from '../../shared/ports/logger.js';

export interface GenerateReportInput {
  readonly repo?: string | undefined;
  readonly out?: string | undefined;
  readonly debug?: boolean | undefined;
}

export async function generateReport(
  input: GenerateReportInput,
  logger: LoggerPort
): Promise<void> {
  const repoLabel = input.repo ?? '<CWD>';
  const outLabel = input.out ?? './archive (relative to CWD)';

  const execLogger = logger.withScope('Generate');
  execLogger.debug('Entering generate command (Stage 1 demo)');
  execLogger.info('repository-inspector :: Stage 1 demo');
  execLogger.info(`  repo : ${repoLabel}`);
  execLogger.info(`  out  : ${outLabel}`);
  execLogger.info(`  debug: ${String(!!input.debug)}`);
  logger.success('Done.');
}
