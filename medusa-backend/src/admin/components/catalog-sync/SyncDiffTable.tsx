import { Badge, Table, Text } from "@medusajs/ui"

import type { CatalogSyncReport } from "../../../lib/catalog-sync/types"

type SyncDiffTableProps = {
  report: CatalogSyncReport | null
}

function resultColor(status: string) {
  if (status === "added") return "green"
  if (status === "changed") return "orange"
  if (status === "error") return "red"
  return "grey"
}

export function SyncDiffTable({ report }: SyncDiffTableProps) {
  if (!report) {
    return (
      <div className="rounded-md border border-ui-border-base p-8 text-center">
        <Text size="small" className="text-ui-fg-muted">
          Run a dry run to preview scaffold changes and validation issues.
        </Text>
      </div>
    )
  }

  const issuesByHandle = new Map<string, number>()
  for (const issue of report.validationIssues) {
    if (!issue.handle) continue
    issuesByHandle.set(issue.handle, (issuesByHandle.get(issue.handle) ?? 0) + 1)
  }

  return (
    <div className="overflow-hidden rounded-md border border-ui-border-base">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Row</Table.HeaderCell>
            <Table.HeaderCell>Handle</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Validation</Table.HeaderCell>
            <Table.HeaderCell>Message</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {report.scaffoldResults.length === 0 ? (
            <Table.Row>
              <td colSpan={5} className="py-8 text-center text-ui-fg-muted">
                No scaffold results.
              </td>
            </Table.Row>
          ) : (
            report.scaffoldResults.map((result) => {
              const issueCount = issuesByHandle.get(result.handle) ?? 0
              return (
                <Table.Row key={`${result.rowNumber}-${result.handle}`}>
                  <Table.Cell>{result.rowNumber}</Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="font-mono">
                      {result.handle}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={resultColor(result.status)}>
                      {result.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={issueCount > 0 ? "red" : "green"}>
                      {issueCount}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {result.message}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )
            })
          )}
        </Table.Body>
      </Table>
    </div>
  )
}
