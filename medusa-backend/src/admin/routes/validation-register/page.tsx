import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, type FormEvent } from "react"

import { sdk } from "../../lib/sdk"

const RECORD_TYPES = ["buyer_validation", "empathy_interview", "evidence_register", "creative_test"] as const
const DECISIONS = ["untested", "ship", "revise", "hold", "retire", "override"] as const

type RecordType = (typeof RECORD_TYPES)[number]

type ValidationEntry = {
  id: string
  record_type: RecordType
  title: string
  asset?: string | null
  claim?: string | null
  status: string
  decision: string
  buyers_tested: number
  pass_count: number
  concern?: string | null
  segment?: string | null
  verbatim?: string | null
  objection?: string | null
  gift_situation?: string | null
  hook?: string | null
  validation_source?: string | null
  owner?: string | null
  week?: string | null
  notes?: string | null
}

type ValidationResponse = {
  entries: ValidationEntry[]
  total: number
}

type EntryForm = {
  title: string
  asset: string
  claim: string
  buyers_tested: string
  pass_count: string
  concern: string
  segment: string
  verbatim: string
  objection: string
  gift_situation: string
  hook: string
  validation_source: string
  owner: string
  week: string
  notes: string
}

const emptyForm: EntryForm = {
  title: "",
  asset: "",
  claim: "",
  buyers_tested: "0",
  pass_count: "0",
  concern: "",
  segment: "",
  verbatim: "",
  objection: "",
  gift_situation: "",
  hook: "",
  validation_source: "",
  owner: "",
  week: "",
  notes: "",
}

function compactBody(form: EntryForm, recordType: RecordType) {
  const body: Record<string, unknown> = {
    record_type: recordType,
    title: form.title,
    buyers_tested: Number(form.buyers_tested) || 0,
    pass_count: Number(form.pass_count) || 0,
  }
  for (const key of ["asset", "claim", "concern", "segment", "verbatim", "objection", "gift_situation", "hook", "validation_source", "owner", "week", "notes"] as const) {
    if (form[key].trim()) body[key] = form[key].trim()
  }
  return body
}

function labelFor(type: RecordType) {
  return type.replace(/_/g, " ")
}

function errorMessage(error: unknown) {
  const err = error as any
  return err?.response?.data?.message || err?.body?.message || err?.message || "Request failed."
}

async function fetchEntries(recordType: RecordType) {
  return sdk.client.fetch<ValidationResponse>(`/admin/custom/validation-register?record_type=${recordType}&take=200`, { method: "GET" })
}

export default function ValidationRegisterPage() {
  const queryClient = useQueryClient()
  const [recordType, setRecordType] = useState<RecordType>("buyer_validation")
  const [form, setForm] = useState<EntryForm>(emptyForm)

  const query = useQuery({
    queryKey: ["horo", "validation-register", recordType],
    queryFn: () => fetchEntries(recordType),
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => sdk.client.fetch("/admin/custom/validation-register", { method: "POST", body }),
    onSuccess: async () => {
      toast.success("Validation entry saved.")
      setForm(emptyForm)
      await queryClient.invalidateQueries({ queryKey: ["horo", "validation-register"] })
    },
    onError: (error) => toast.error("Save failed.", { description: errorMessage(error) }),
  })

  const decisionMutation = useMutation({
    mutationFn: ({ entry, decision }: { entry: ValidationEntry; decision: string }) =>
      sdk.client.fetch(`/admin/custom/validation-register/${encodeURIComponent(entry.id)}`, {
        method: "PATCH",
        body: { decision, status: decision === "untested" ? "draft" : "decided" },
      }),
    onSuccess: async () => {
      toast.success("Decision updated.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "validation-register"] })
    },
    onError: (error) => toast.error("Update failed.", { description: errorMessage(error) }),
  })

  const deleteMutation = useMutation({
    mutationFn: (entry: ValidationEntry) =>
      sdk.client.fetch(`/admin/custom/validation-register/${encodeURIComponent(entry.id)}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Entry archived.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "validation-register"] })
    },
    onError: (error) => toast.error("Archive failed.", { description: errorMessage(error) }),
  })

  const entries = query.data?.entries ?? []
  const visibleFields = useMemo(() => {
    if (recordType === "empathy_interview") return ["segment", "verbatim", "objection", "gift_situation"] as const
    if (recordType === "evidence_register") return ["claim", "validation_source"] as const
    if (recordType === "creative_test") return ["hook", "asset"] as const
    return ["asset", "concern"] as const
  }, [recordType])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(compactBody(form, recordType))
  }

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Heading level="h1">Validation Register</Heading>
          <Badge size="small" color="blue">V1.5.2</Badge>
        </div>
        <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
          Buyer validation, empathy interviews, evidence register, and creative-test decisions before buyer-facing assets go live.
        </Text>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {RECORD_TYPES.map((type) => (
          <Button key={type} size="small" variant={recordType === type ? "primary" : "secondary"} onClick={() => setRecordType(type)}>
            {labelFor(type)}
          </Button>
        ))}
      </div>

      <form onSubmit={submit} className="mb-6 rounded-md border border-ui-border-base p-5">
        <Heading level="h2" className="mb-4">New {labelFor(recordType)} entry</Heading>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label size="small" htmlFor="vr-title">Title</Label>
            <Input id="vr-title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <Label size="small" htmlFor="vr-owner">Owner / week</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input id="vr-owner" placeholder="Owner" value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} />
              <Input placeholder="Week" value={form.week} onChange={(e) => setForm((p) => ({ ...p, week: e.target.value }))} />
            </div>
          </div>
          {visibleFields.map((field) => (
            <div key={field}>
              <Label size="small" htmlFor={`vr-${field}`}>{field.replace(/_/g, " ")}</Label>
              <Input id={`vr-${field}`} value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label size="small" htmlFor="vr-buyers">Buyers tested</Label>
              <Input id="vr-buyers" type="number" min={0} value={form.buyers_tested} onChange={(e) => setForm((p) => ({ ...p, buyers_tested: e.target.value }))} />
            </div>
            <div>
              <Label size="small" htmlFor="vr-pass">Pass count</Label>
              <Input id="vr-pass" type="number" min={0} value={form.pass_count} onChange={(e) => setForm((p) => ({ ...p, pass_count: e.target.value }))} />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label size="small" htmlFor="vr-notes">Notes</Label>
            <Textarea id="vr-notes" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <Button type="submit" className="mt-4" isLoading={createMutation.isPending}>Save entry</Button>
      </form>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Entry</Table.HeaderCell>
            <Table.HeaderCell>Evidence</Table.HeaderCell>
            <Table.HeaderCell>Pass</Table.HeaderCell>
            <Table.HeaderCell>Decision</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {entries.map((entry) => (
            <Table.Row key={entry.id}>
              <Table.Cell>
                <Text size="small" weight="plus">{entry.title}</Text>
                <Text size="xsmall" className="mt-1 text-ui-fg-muted">{[entry.owner, entry.week].filter(Boolean).join(" · ") || entry.status}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text size="small">{entry.asset || entry.claim || entry.hook || entry.segment || "—"}</Text>
                <Text size="xsmall" className="mt-1 max-w-md truncate text-ui-fg-muted">{entry.concern || entry.verbatim || entry.validation_source || entry.notes || ""}</Text>
              </Table.Cell>
              <Table.Cell>{entry.pass_count}/{entry.buyers_tested}</Table.Cell>
              <Table.Cell><Badge size="small" color={entry.decision === "ship" ? "green" : entry.decision === "revise" ? "orange" : "grey"}>{entry.decision}</Badge></Table.Cell>
              <Table.Cell>
                <div className="flex flex-wrap gap-2">
                  {DECISIONS.map((decision) => (
                    <Button key={decision} size="small" variant="secondary" onClick={() => decisionMutation.mutate({ entry, decision })}>{decision}</Button>
                  ))}
                  <Button size="small" variant="danger" onClick={() => deleteMutation.mutate(entry)}>Archive</Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Validation Register",
  rank: 73,
})

