/**
 * GenerateReportUseCase (Stage 3 - Classification).
 * Lists discovered files (sorted) and prints a simple summary.
 * This remains independent from CLI details and side-effects outside logging.
 */

import { resolve } from 'node:path';

//* Shared imports
import type { LoggerPort } from '../../shared/ports/logger.js';
import { DEFAULT_MAX_BYTES } from '../../shared/constants.js';
import { isLikelyBinary } from '../../shared/utils/binary.js';
import { mapWithConcurrency } from '../../shared/utils/concurrency.js';

//* Domain imports
import type { DiscoveryPort } from '../../domain/ports/discovery.js';
import {
  buildExcludedDirNameSetLower,
  buildExcludedFileNameSetLower,
} from '../../domain/policies/fs-exclusions.js';
import { ClassificationService } from '../../domain/services/classification-service.js';
import type { ReaderPort } from '../../domain/ports/reader.js';

//* Adapters imports
import { FilesystemWalker } from '../../adapters/outbound/discovery/fs-walker.js';
import { FSReader } from '../../adapters/outbound/reader/fs-reader.js';

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
  const discovery: DiscoveryPort = new FilesystemWalker();
  const reader: ReaderPort = new FSReader();
  const classifier = new ClassificationService({
    maxBytes: DEFAULT_MAX_BYTES,
    headSampleBytes: 4_096,
  });

  //! Logs
  execLogger.debug(`Resolved root: ${rootAbs}`);
  execLogger.info('repository-inspector :: Stage 3: Classification (code/config/omit)');

  const files = await discovery.discover({
    rootAbsPath: rootAbs,
    excludedDirNames: buildExcludedDirNameSetLower(),
    excludedFileNames: buildExcludedFileNameSetLower(),
  });

  const listLogger = logger.withScope('Files');
  if (files.length === 0) {
    listLogger.warn('No se encontraron archivos (tras aplicar exclusiones).');
  } else {
    listLogger.info('path | category | reason');
    listLogger.info('-----|----------|-------');

    const readerOpts = { rootAbsPath: rootAbs, maxBytes: DEFAULT_MAX_BYTES } as const;

    //TODO: Should be declared here?
    type Row = {
      relativePath: string;
      category: 'code' | 'config' | 'omit';
      reason?: string | undefined;
    };

    const results = await mapWithConcurrency(files, 8, async (f): Promise<Row> => {
      try {
        const result = await classifier.classifyOne(f.relativePath, reader, readerOpts, (buf) =>
          isLikelyBinary(buf)
        );
        switch (result.decision.category) {
          case 'code':
            return { relativePath: f.relativePath, category: 'code' };
          case 'config':
            return { relativePath: f.relativePath, category: 'config' };
          case 'omit':
            return {
              relativePath: f.relativePath,
              category: 'omit',
              reason: result.decision.reason,
            };
        }
      } catch (e) {
        return { relativePath: f.relativePath, category: 'omit', reason: 'READ_ERROR' };
      }
    });

    let countCode = 0,
      countConfig = 0,
      countOmit = 0;
    for (const result of results) {
      if (result.category === 'code') {
        countCode++;
        listLogger.info(`${result.relativePath} | code |`);
        continue;
      }
      if (result.category === 'config') {
        countConfig++;
        listLogger.info(`${result.relativePath} | config |`);
        continue;
      }
      countOmit++;
      listLogger.info(`${result.relativePath} | omit | ${result.reason}`);
    }

    const summary = logger.withScope('Summary');
    summary.success(`Total archivos descubiertos: ${files.length}`);
    summary.success(`-- Total archivos de código: ${countCode}`);
    summary.success(`-- Total archivos de configuración: ${countConfig}`);
    summary.success(`-- Total archivos omitidos: ${countOmit}`);
  }
}
