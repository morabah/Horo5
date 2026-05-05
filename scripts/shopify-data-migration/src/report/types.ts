export interface MigrationReport {
  date: string;
  store: string;
  mode: 'dry-run' | 'apply';
  scope: string[];
  created: string[];
  skipped: string[];
  updated: string[];
  conflicts: string[];
  missingReferences: string[];
  missingImages: string[];
  warnings: string[];
  errors: string[];
  nextSteps: string[];
}

export function createEmptyReport(): MigrationReport {
  return {
    date: new Date().toISOString(),
    store: '',
    mode: 'dry-run',
    scope: [],
    created: [],
    skipped: [],
    updated: [],
    conflicts: [],
    missingReferences: [],
    missingImages: [],
    warnings: [],
    errors: [],
    nextSteps: [],
  };
}
