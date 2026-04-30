import { Badge, Heading, Text } from "@medusajs/ui"

import type { DropLookups } from "../drops/types"
import type { TaxonomyAuditReport } from "../../../lib/taxonomy/audit"

type TaxonomyTreeProps = {
  lookups: DropLookups | undefined
  audit: TaxonomyAuditReport | undefined
}

export function TaxonomyTree({ lookups, audit }: TaxonomyTreeProps) {
  const feelings = lookups?.feelings ?? []
  const subfeelings = lookups?.subfeelings ?? []
  const occasions = lookups?.occasions ?? []
  const counts = audit?.counts

  return (
    <section className="rounded-md border border-ui-border-base p-5">
      <Heading level="h2" className="mb-4">
        Taxonomy Tree
      </Heading>
      <div className="grid gap-4">
        {feelings.length === 0 ? (
          <Text size="small" className="text-ui-fg-muted">
            No feelings found.
          </Text>
        ) : null}
        {feelings.map((feeling) => {
          const children = subfeelings.filter((subfeeling) => subfeeling.feelingSlug === feeling.slug)
          return (
            <div key={feeling.slug} className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Text size="base" weight="plus">
                    {feeling.name}
                  </Text>
                  <Text size="xsmall" className="font-mono text-ui-fg-muted">
                    {feeling.slug}
                  </Text>
                </div>
                <Badge size="small" color="blue">
                  {counts?.byFeeling[feeling.slug] ?? 0} products
                </Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {children.map((subfeeling) => (
                  <div key={subfeeling.slug} className="rounded-md border border-ui-border-base bg-ui-bg-base p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Text size="small" weight="plus">
                          {subfeeling.name}
                        </Text>
                        <Text size="xsmall" className="font-mono text-ui-fg-muted">
                          {subfeeling.slug}
                        </Text>
                      </div>
                      <Badge size="small" color="grey">
                        {counts?.bySubfeeling[subfeeling.slug] ?? 0}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5">
        <Text size="small" weight="plus" className="mb-2">
          Occasions
        </Text>
        <div className="flex flex-wrap gap-2">
          {occasions.map((occasion) => (
            <Badge key={occasion.slug} size="small" color={occasion.active === false ? "grey" : "green"}>
              {occasion.name} · {counts?.byOccasion[occasion.slug] ?? 0}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}
