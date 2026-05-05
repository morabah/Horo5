/**
 * Extract static defaults from web-next domain config.
 * Used only for sensible defaults (size tables, trust chips, feature labels).
 * Does NOT import fake reviews or hardcoded marketing copy.
 */

import * as logger from '../utils/logger.js';

export interface WebDefaults {
  trustChips: string[];
  featureLabels: string[];
  sizeTableDefaults: Array<{ name: string; unit_system: string; rows: Array<Record<string, string>>; note: string }>;
}

export function extractFromWebNext(): WebDefaults | null {
  logger.info('Attempting web-next extraction...');

  // Placeholder: read web/src/data/domain-config.ts if available
  // For now, return null to indicate "no data extracted"
  logger.warn('web-next extraction not yet implemented. Provide JSON input files instead.');
  return null;
}
