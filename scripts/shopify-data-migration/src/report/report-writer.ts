import * as fs from 'fs';
import * as path from 'path';
import { MigrationReport } from './types.js';

export function writeReports(report: MigrationReport, outDir: string): void {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // JSON report
  const jsonPath = path.join(outDir, 'migration-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  // Markdown report
  const mdPath = path.join(outDir, report.mode === 'dry-run' ? 'dry-run-report.md' : 'migration-report.md');
  fs.writeFileSync(mdPath, toMarkdown(report), 'utf-8');
}

function toMarkdown(report: MigrationReport): string {
  const sections: string[] = [];

  sections.push(`# HORO Shopify Migration ${report.mode === 'dry-run' ? 'Dry-Run' : 'Report'}`);
  sections.push('');
  sections.push(`**Date:** ${report.date}`);
  sections.push(`**Store:** ${report.store}`);
  sections.push(`**Mode:** ${report.mode}`);
  sections.push(`**Scope:** ${report.scope.join(', ')}`);
  sections.push('');

  sections.push('## Summary');
  sections.push(`- **Created:** ${report.created.length}`);
  sections.push(`- **Skipped:** ${report.skipped.length}`);
  sections.push(`- **Updated:** ${report.updated.length}`);
  sections.push(`- **Conflicts:** ${report.conflicts.length}`);
  sections.push(`- **Missing references:** ${report.missingReferences.length}`);
  sections.push(`- **Missing images:** ${report.missingImages.length}`);
  sections.push(`- **Warnings:** ${report.warnings.length}`);
  sections.push(`- **Errors:** ${report.errors.length}`);
  sections.push('');

  if (report.created.length > 0) {
    sections.push('## Created');
    report.created.forEach((c) => sections.push(`- ${c}`));
    sections.push('');
  }

  if (report.skipped.length > 0) {
    sections.push('## Skipped');
    report.skipped.forEach((s) => sections.push(`- ${s}`));
    sections.push('');
  }

  if (report.errors.length > 0) {
    sections.push('## Errors');
    report.errors.forEach((e) => sections.push(`- ${e}`));
    sections.push('');
  }

  if (report.missingReferences.length > 0) {
    sections.push('## Missing References');
    report.missingReferences.forEach((m) => sections.push(`- ${m}`));
    sections.push('');
  }

  if (report.warnings.length > 0) {
    sections.push('## Warnings');
    report.warnings.forEach((w) => sections.push(`- ${w}`));
    sections.push('');
  }

  if (report.nextSteps.length > 0) {
    sections.push('## Next Manual Steps');
    report.nextSteps.forEach((s) => sections.push(`- ${s}`));
    sections.push('');
  }

  return sections.join('\n');
}
