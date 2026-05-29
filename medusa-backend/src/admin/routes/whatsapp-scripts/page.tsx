import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { sdk } from "../../lib/sdk"

const PURPOSES = ["opening", "cod_confirmation", "gift_help", "exchange", "ugc_request"] as const
const LOCALES = ["en", "ar"] as const

type WhatsappScript = {
  id: string
  name: string
  purpose: string
  body_template: string
  locale: string
  version: number
  active: boolean
  sort_order: number
}

type ScriptsResponse = {
  scripts: WhatsappScript[]
  total: number
}

type ScriptForm = {
  name: string
  purpose: string
  body_template: string
  locale: string
  version: string
  sort_order: string
}

const emptyForm: ScriptForm = {
  name: "",
  purpose: "opening",
  body_template: "",
  locale: "en",
  version: "1",
  sort_order: "0",
}

function toBody(form: ScriptForm) {
  return {
    name: form.name,
    purpose: form.purpose,
    body_template: form.body_template,
    locale: form.locale,
    version: Number(form.version) || 1,
    sort_order: Number(form.sort_order) || 0,
    active: true,
  }
}

function errorMessage(error: unknown) {
  const err = error as any
  return err?.response?.data?.message || err?.body?.message || err?.message || "Request failed."
}

async function fetchScripts() {
  return sdk.client.fetch<ScriptsResponse>("/admin/custom/whatsapp-scripts?take=200", { method: "GET" })
}

export default function WhatsappScriptsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ScriptForm>(emptyForm)
  const scriptsQuery = useQuery({
    queryKey: ["horo", "whatsapp-scripts"],
    queryFn: fetchScripts,
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof toBody>) =>
      sdk.client.fetch("/admin/custom/whatsapp-scripts", { method: "POST", body: payload }),
    onSuccess: async () => {
      toast.success("WhatsApp script saved.")
      setForm(emptyForm)
      await queryClient.invalidateQueries({ queryKey: ["horo", "whatsapp-scripts"] })
    },
    onError: (error) => toast.error("Save failed.", { description: errorMessage(error) }),
  })

  const toggleMutation = useMutation({
    mutationFn: (script: WhatsappScript) =>
      sdk.client.fetch(`/admin/custom/whatsapp-scripts/${encodeURIComponent(script.id)}`, {
        method: "PATCH",
        body: { active: !script.active },
      }),
    onSuccess: async () => {
      toast.success("Script status updated.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "whatsapp-scripts"] })
    },
    onError: (error) => toast.error("Update failed.", { description: errorMessage(error) }),
  })

  const deleteMutation = useMutation({
    mutationFn: (script: WhatsappScript) =>
      sdk.client.fetch(`/admin/custom/whatsapp-scripts/${encodeURIComponent(script.id)}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Script archived.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "whatsapp-scripts"] })
    },
    onError: (error) => toast.error("Archive failed.", { description: errorMessage(error) }),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(toBody(form))
  }

  const scripts = scriptsQuery.data?.scripts ?? []

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">WhatsApp Scripts</Heading>
            <Badge size="small" color="blue">
              V1.5.2
            </Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            Versioned EN/AR script bank for opening, COD confirmation, gift help, exchange, and UGC request flows.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => void scriptsQuery.refetch()} isLoading={scriptsQuery.isFetching}>
          Refresh
        </Button>
      </div>

      <form onSubmit={submit} className="mb-6 rounded-md border border-ui-border-base p-5">
        <Heading level="h2" className="mb-4">New script</Heading>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label size="small" htmlFor="was-name">Name</Label>
            <Input id="was-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <Label size="small" htmlFor="was-purpose">Purpose</Label>
            <select id="was-purpose" className="block h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-sm" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}>
              {PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{purpose.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <Label size="small" htmlFor="was-locale">Locale</Label>
            <select id="was-locale" className="block h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-sm" value={form.locale} onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))}>
              {LOCALES.map((locale) => <option key={locale} value={locale}>{locale}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label size="small" htmlFor="was-version">Version</Label>
              <Input id="was-version" type="number" min={1} value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} />
            </div>
            <div>
              <Label size="small" htmlFor="was-sort">Sort</Label>
              <Input id="was-sort" type="number" min={0} value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label size="small" htmlFor="was-body">Body template</Label>
            <Textarea id="was-body" rows={5} value={form.body_template} onChange={(e) => setForm((p) => ({ ...p, body_template: e.target.value }))} required />
          </div>
        </div>
        <Button type="submit" className="mt-4" isLoading={createMutation.isPending}>Save script</Button>
      </form>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Purpose</Table.HeaderCell>
            <Table.HeaderCell>Locale</Table.HeaderCell>
            <Table.HeaderCell>Version</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {scripts.map((script) => (
            <Table.Row key={script.id}>
              <Table.Cell>
                <Text size="small" weight="plus">{script.name}</Text>
                <Text size="xsmall" className="mt-1 max-w-md truncate text-ui-fg-muted">{script.body_template}</Text>
              </Table.Cell>
              <Table.Cell>{script.purpose.replace(/_/g, " ")}</Table.Cell>
              <Table.Cell>{script.locale}</Table.Cell>
              <Table.Cell>{script.version}</Table.Cell>
              <Table.Cell><Badge size="small" color={script.active ? "green" : "grey"}>{script.active ? "active" : "inactive"}</Badge></Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  <Button size="small" variant="secondary" onClick={() => toggleMutation.mutate(script)}>
                    {script.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="small" variant="danger" onClick={() => deleteMutation.mutate(script)}>Archive</Button>
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
  label: "WhatsApp Scripts",
  rank: 72,
})

