import { Badge, Heading, Table, Text } from "@medusajs/ui"

import type { TaxonomyAuditReport } from "../../../lib/taxonomy/audit"

type AuditTableProps = {
  audit: TaxonomyAuditReport | undefined
  loading?: boolean
}

function typeColor(type: string) {
  if (type === "invalid_occasion") return "orange"
  if (type === "assignment_error") return "red"
  return "grey"
}

export function AuditTable({ audit, loading }: AuditTableProps) {
  const issues = audit?.issues ?? []

  return (
    <section className="rounded-md border border-ui-border-base p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Heading level="h2">Audit</Heading>
          <Text size="small" className="mt-1 text-ui-fg-subtle">
            {audit ? `${audit.checked} products checked` : "No audit loaded"}
          </Text>
        </div>
        <Badge size="small" color={issues.length ? "red" : "green"}>
          {issues.length} issues
        </Badge>
      </div>
      <div className="overflow-hidden rounded-md border border-ui-border-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Message</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <td colSpan={3} className="py-8 text-center text-ui-fg-muted">
                  Loading audit...
                </td>
              </Table.Row>
            ) : issues.length === 0 ? (
              <Table.Row>
                <td colSpan={3} className="py-8 text-center text-ui-fg-muted">
                  No taxonomy issues found.
                </td>
              </Table.Row>
            ) : (
              issues.map((issue, index) => (
                <Table.Row key={`${issue.productId}-${issue.type}-${index}`}>
                  <Table.Cell>
                    <Text size="small" className="font-mono">
                      {issue.handle}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={typeColor(issue.type)}>
                      {issue.type}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {issue.message}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>
    </section>
  )
}
