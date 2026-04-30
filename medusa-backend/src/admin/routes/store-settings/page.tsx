import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import { DeliveryConfigForm } from "../../components/store-settings/DeliveryConfigForm"
import { SizeTablesEditor } from "../../components/store-settings/SizeTablesEditor"
import { sdk } from "../../lib/sdk"
import type {
  StoreSettings,
  StoreSettingsValidationIssue,
} from "../../../lib/store-settings/types"

type StoreSettingsResponse = StoreSettings & {
  issues?: StoreSettingsValidationIssue[]
}

const none = "__none__"

async function fetchStoreSettings() {
  return sdk.client.fetch<StoreSettingsResponse>("/admin/custom/store-settings", { method: "GET" })
}

async function saveStoreSettings(settings: StoreSettings) {
  return sdk.client.fetch<StoreSettings>("/admin/custom/store-settings", {
    method: "PUT",
    body: settings,
  })
}

function errorMessage(error: unknown) {
  const body = error as { message?: string; body?: { message?: string; issues?: StoreSettingsValidationIssue[] } }
  const issues = body.body?.issues
  if (issues?.length) {
    return issues.map((issue) => `${issue.field}: ${issue.message}`).join("\n")
  }
  return body.body?.message || body.message || (error instanceof Error ? error.message : "Save failed.")
}

export default function StoreSettingsPage() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["horo", "store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (data) {
      setSettings({
        delivery: data.delivery,
        sizeTables: data.sizeTables,
        defaultSizeTableKey: data.defaultSizeTableKey,
        storefrontUrl: data.storefrontUrl,
      })
      if (data.issues?.length) {
        setStatusMsg(data.issues.map((issue) => `${issue.field}: ${issue.message}`).join("\n"))
      }
    }
  }, [data])

  const sizeTableKeys = useMemo(() => Object.keys(settings?.sizeTables ?? {}).sort(), [settings?.sizeTables])
  const defaultSelectValue = settings?.defaultSizeTableKey && sizeTableKeys.includes(settings.defaultSizeTableKey)
    ? settings.defaultSizeTableKey
    : none

  const mutation = useMutation({
    mutationFn: async () => {
      if (!settings) throw new Error("Settings are still loading.")
      return saveStoreSettings(settings)
    },
    onSuccess: async (saved) => {
      setSettings(saved)
      setStatusMsg("Store settings saved.")
      toast.success("Store settings saved.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "store-settings"] })
      await queryClient.invalidateQueries({ queryKey: ["horo", "drops", "lookups"] })
      await queryClient.invalidateQueries({ queryKey: ["horo", "storefront-size-table-options"] })
    },
    onError: (error) => {
      const message = errorMessage(error)
      setStatusMsg(message)
      toast.error("Store settings save failed.", { description: message })
    },
  })

  const busy = isLoading || mutation.isPending || !settings

  return (
    <Container className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1">Store Settings</Heading>
            <Badge size="small" color="blue">
              metadata
            </Badge>
          </div>
          <Text size="small" className="mt-1 max-w-3xl text-ui-fg-subtle">
            Edit storefront delivery, size-guide presets, the default preset, and the storefront preview URL.
          </Text>
        </div>
        <Button
          type="button"
          size="small"
          disabled={busy}
          isLoading={mutation.isPending}
          onClick={() => {
            setStatusMsg(null)
            mutation.mutate()
          }}
        >
          Save
        </Button>
      </div>

      {statusMsg ? (
        <div className="mb-4 whitespace-pre-wrap rounded-md border border-ui-border-base bg-ui-bg-subtle p-3">
          <Text size="small" className="text-ui-fg-muted">
            {statusMsg}
          </Text>
        </div>
      ) : null}

      {settings ? (
        <div className="grid gap-5">
          <DeliveryConfigForm
            value={settings.delivery}
            disabled={mutation.isPending}
            onChange={(delivery) => setSettings((prev) => prev ? { ...prev, delivery } : prev)}
          />

          <section className="rounded-md border border-ui-border-base p-5">
            <Heading level="h2" className="mb-4">
              Default Size Table
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="default-size-table" className="text-xs">
                  Default preset
                </Label>
                <Select
                  size="small"
                  value={defaultSelectValue}
                  onValueChange={(next) => {
                    if (next === none) return
                    setSettings((prev) => prev ? { ...prev, defaultSizeTableKey: next } : prev)
                  }}
                >
                  <Select.Trigger id="default-size-table">
                    <Select.Value placeholder="Select preset" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={none}>Select preset</Select.Item>
                    {sizeTableKeys.map((key) => (
                      <Select.Item key={key} value={key}>
                        {key}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="storefront-url" className="text-xs">
                  Storefront URL
                </Label>
                <Input
                  id="storefront-url"
                  size="small"
                  value={settings.storefrontUrl ?? ""}
                  disabled={mutation.isPending}
                  placeholder="https://horo.example"
                  onChange={(event) => {
                    const storefrontUrl = event.target.value
                    setSettings((prev) => prev ? { ...prev, storefrontUrl } : prev)
                  }}
                />
              </div>
            </div>
          </section>

          <SizeTablesEditor
            value={settings.sizeTables}
            disabled={mutation.isPending}
            onChange={(sizeTables) => {
              setSettings((prev) => {
                if (!prev) return prev
                const keys = Object.keys(sizeTables).sort()
                const defaultSizeTableKey = sizeTables[prev.defaultSizeTableKey]
                  ? prev.defaultSizeTableKey
                  : keys[0] ?? ""
                return { ...prev, sizeTables, defaultSizeTableKey }
              })
            }}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              size="small"
              disabled={busy}
              isLoading={mutation.isPending}
              onClick={() => {
                setStatusMsg(null)
                mutation.mutate()
              }}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-ui-border-base p-8 text-center">
          <Text size="small" className="text-ui-fg-muted">
            Loading store settings...
          </Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Store Settings",
  rank: 30,
  icon: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.37a1.7 1.7 0 0 0-1 .93l-.03.08a2 2 0 0 1-3.74 0l-.03-.08a1.7 1.7 0 0 0-1-.93 1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-.93-1l-.08-.03a2 2 0 0 1 0-3.74l.08-.03a1.7 1.7 0 0 0 .93-1 1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-.93l.03-.08a2 2 0 0 1 3.74 0l.03.08a1.7 1.7 0 0 0 1 .93 1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.37 9c.17.4.5.74.93 1l.08.03a2 2 0 0 1 0 3.74l-.08.03a1.7 1.7 0 0 0-.9 1.2Z" />
    </svg>
  ),
})
