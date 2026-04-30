import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export {
  buildMarkdownReport,
  galleryTagForFilename,
  parseCatalogSyncArgs,
  parseCommaList,
  parseCsv,
  parseSheetRows,
  parseSizes,
  parseStockPerSize,
  runCatalogSync,
  scaffoldCatalogDrops,
  validateCatalogRows,
  writeCatalogSyncReport,
} from "../lib/catalog-sync/sync"
export type {
  CatalogRow,
  CatalogSyncOptions,
  CatalogSyncReport,
  GalleryTag,
  ProductSizeKey,
  ProductStatus,
  RawSheetRow,
  ScaffoldResult,
  StockMap,
  ValidationIssue,
} from "../lib/catalog-sync/sync"

import {
  parseCatalogSyncArgs,
  runCatalogSync,
  writeCatalogSyncReport,
} from "../lib/catalog-sync/sync"

function cliArgs(args: unknown): string[] {
  return (Array.isArray(args) ? args : [])
    .filter((arg): arg is string => typeof arg === "string")
    .filter((arg) => arg !== "--")
}

export default async function syncCatalogFromSheet({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const options = parseCatalogSyncArgs([...cliArgs(args), ...process.argv])

  const report = await runCatalogSync({ container, options })
  await writeCatalogSyncReport(options.reportPath, report, process.cwd())

  logger.info(
    `catalog:sync rows=${report.selectedRows}, ready=${report.readyRows}, validation-errors=${report.validationIssues.length}, import=${report.importHandles.length}`,
  )

  if (options.reportPath) {
    logger.info(`catalog:sync report written to ${options.reportPath}`)
  }

  if (!options.allowPartial && (report.validationIssues.length > 0 || report.stageErrors.length > 0)) {
    process.exitCode = 1
  }
}
