/**
 * GenerateReportUseCase (Stage 2 - Discovery demo).
 * Lists discovered files (sorted) and prints a simple summary.
 * This remains independent from CLI details and side-effects outside logging.
 */

import { resolve } from 'node:path';

//* Shared imports
import type { LoggerPort } from '../../shared/ports/logger.js';

//* Domain imports
import type { DiscoveryPort } from '../../domain/ports/discovery.js';
import { buildExcludedDirNameSetLower, buildExcludedFileNameSetLower } from '../../domain/policies/fs-exclusions.js';
import { FilesystemWalker } from '../../adapters/outbound/discovery/fs-walker.js';

export interface GenerateReportInput {
  readonly repo?: string | undefined;
  readonly out?: string | undefined;
  readonly debug?: boolean | undefined;
}

export async function generateReport(
  input: GenerateReportInput,
  logger: LoggerPort
): Promise<void> {
  const execLogger = logger.withScope('Generate');

  // Resolve root: default to CWD but avoid leaking absolute paths outside logs.
  const rootAbs = resolve(input.repo ?? process.cwd());

  // Stage-2: wire FilesystemWalker as DiscoveryPort.
  const discovery: DiscoveryPort = new FilesystemWalker();

  //! Logs
  execLogger.debug(`Resolved root: ${rootAbs}`);
  execLogger.info('repository-inspector :: Stage 2: Discovery list of files.');

  const files = await discovery.discover({
    rootAbsPath: rootAbs,
    excludedDirNames: buildExcludedDirNameSetLower(),
    excludedFileNames: buildExcludedFileNameSetLower(),
  });

  // Demo output: List of files.
  const listLogger = logger.withScope('Files');
  if (files.length === 0) {
    listLogger.warn('No se encontraron archivos (tras aplicar exclusiones).');
  } else {
    for (const file of files) {
      listLogger.info(file.relativePath);
    }
  }

  const summary = logger.withScope('Summary');
  summary.success(`Total archivos descubiertos: ${files.length}`);
}
