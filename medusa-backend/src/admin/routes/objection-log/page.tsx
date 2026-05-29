import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { sdk } from "../../lib/sdk"

const SOURCES = ["pdp", "cart", "checkout", "post_purchase", "buyer_interview"] as const
const CATEGORIES = ["price", "size", "trust", "delivery", "gift_fit", "other"] as const
const PRIORITIES = ["low", "medium", "high"] as const

type Objection = {
  id: string
  source: string
  objection: string
  category: string
  product_slug?: string | null
  order_id?: string | null
  buyer_segment?: string | null
  resolved: boolean
  resolution?: string | null
  assigned_to?: string | null
  priority: string
}

type ObjectionResponse = {
  objections: Objection[]
  total: number
}

const emptyForm = {
  source: "pdp",
  objection: "",
  category: "other",
  product_slug: "",
  order_id: "",
  buyer_segment: "",
  priority: "medium",
}

function errorMessage(error: unknown) {
  const err = error as any
  return err?.response?.data?.message || err?.body?.message || err?.message || "Request failed."
}

async function fetchObjections() {
  return sdk.client.fetch<ObjectionResponse>("/admin/custom/objection-log?take=200&resolved=false", { method: "GET" })
}

export default function ObjectionLogPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const query = useQuery({
    queryKey: ["horo", "objection-log"],
    queryFn: fetchObjections,
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: (body: typeof emptyForm) => sdk.client.fetch("/admin/custom/objection-log", { method: "POST", body }),
    onSuccess: async () => {
      toast.success("Objection logged.")
      setForm(emptyForm)
      await queryClient.invalidateQueries({ queryKey: ["horo", "objection-log"] })
    },
    onError: (error) => toast.error("Save failed.", { description: errorMessage(error) }),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ objection, resolution }: { objection: Objection; resolution: string }) =>
      sdk.client.fetch(`/admin/custom/objection-log/${encodeURIComponent(objection.id)}`, {
        method: "PATCH",
        body: { resolved: true, resolution },
      }),
    onSuccess: async () => {
      toast.success("Objection resolved.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "objection-log"] })
    },
    onError: (error) => toast.error("Update failed.", { description: errorMessage(error) }),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(form)
  }

  const objections = query.data?.objections ?? []

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">Objection Log</Heading>
            <Badge size="small" color="orange">{objections.length} open</Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            Capture price, size, trust, delivery, and gift-fit objections so PDP and WhatsApp scripts can improve weekly.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => void query.refetch()} isLoading={query.isFetching}>Refresh</Button>
      </div>

      <form onSubmit={submit} className="mb-6 rounded-md border border-ui-border-base p-5">
        <Heading level="h2" className="mb-4">New objection</Heading>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label size="small" htmlFor="obj-source">Source</Label>
            <select id="obj-source" className="block h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-sm" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}>
              {SOURCES.map((source) => <option key={source} value={source}>{source.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label size="small" htmlFor="obj-category">Category</Label>
              <select id="obj-category" className="block h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-sm" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <Label size="small" htmlFor="obj-priority">Priority</Label>
              <select id="obj-priority" className="block h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-sm" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label size="small" htmlFor="obj-text">Objection</Label>
            <Textarea id="obj-text" rows={3} value={form.objection} onChange={(e) => setForm((p) => ({ ...p, objection: e.target.value }))} required />
          </div>
          <Input placeholder="Product slug" value={form.product_slug} onChange={(e) => setForm((p) => ({ ...p, product_slug: e.target.value }))} />
          <Input placeholder="Order id / HORO ref" value={form.order_id} onChange={(e) => setForm((p) => ({ ...p, order_id: e.target.value }))} />
          <Input placeholder="Buyer segment" value={form.buyer_segment} onChange={(e) => setForm((p) => ({ ...p, buyer_segment: e.target.value }))} />
        </div>
        <Button type="submit" className="mt-4" isLoading={createMutation.isPending}>Log objection</Button>
      </form>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Objection</Table.HeaderCell>
            <Table.HeaderCell>Category</Table.HeaderCell>
            <Table.HeaderCell>Context</Table.HeaderCell>
            <Table.HeaderCell>Priority</Table.HeaderCell>
            <Table.HeaderCell>Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {objections.map((objection) => (
            <Table.Row key={objection.id}>
              <Table.Cell><Text size="small" className="max-w-lg">{objection.objection}</Text></Table.Cell>
              <Table.Cell>{objection.category.replace(/_/g, " ")}</Table.Cell>
              <Table.Cell>
                <Text size="small">{objection.source.replace(/_/g, " ")}</Text>
                <Text size="xsmall" className="mt-1 text-ui-fg-muted">{[objection.product_slug, objection.order_id, objection.buyer_segment].filter(Boolean).join(" · ") || "—"}</Text>
              </Table.Cell>
              <Table.Cell><Badge size="small" color={objection.priority === "high" ? "red" : objection.priority === "medium" ? "orange" : "grey"}>{objection.priority}</Badge></Table.Cell>
              <Table.Cell>
                <Button size="small" variant="secondary" onClick={() => resolveMutation.mutate({ objection, resolution: "Resolved from admin queue." })}>
                  Resolve
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Objection Log",
  rank: 74,
})

