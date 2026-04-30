import { Heading, Input, Label, Text } from "@medusajs/ui"

import type { DeliveryConfig } from "../../../lib/store-settings/types"

type DeliveryConfigFormProps = {
  value: DeliveryConfig
  disabled?: boolean
  onChange: (value: DeliveryConfig) => void
}

type DeliveryField = {
  key: keyof DeliveryConfig
  label: string
  min: number
  max: number
  optional?: boolean
}

const FIELDS: DeliveryField[] = [
  { key: "standardMinDays", label: "Standard min days", min: 1, max: 30 },
  { key: "standardMaxDays", label: "Standard max days", min: 1, max: 30 },
  { key: "expressMinDays", label: "Express min days", min: 1, max: 30 },
  { key: "expressMaxDays", label: "Express max days", min: 1, max: 30 },
  { key: "cutoffHourLocal", label: "Cutoff hour local", min: 0, max: 23 },
  { key: "cutoffMinuteLocal", label: "Cutoff minute local", min: 0, max: 59 },
  { key: "standardMaxBusinessDays", label: "Standard max business days", min: 1, max: 30 },
  { key: "jsonLdStandardShippingEgp", label: "JSON-LD standard shipping (EGP)", min: 0, max: 500000, optional: true },
]

export function DeliveryConfigForm({ value, disabled, onChange }: DeliveryConfigFormProps) {
  const updateField = (key: keyof DeliveryConfig, rawValue: string, optional?: boolean) => {
    if (optional && rawValue === "") {
      onChange({ ...value, [key]: null })
      return
    }
    const next = rawValue === "" ? 0 : Number(rawValue)
    onChange({
      ...value,
      [key]: Number.isFinite(next) ? Math.trunc(next) : 0,
    })
  }

  return (
    <section className="rounded-md border border-ui-border-base p-5">
      <div className="mb-4">
        <Heading level="h2">Delivery Config</Heading>
        <Text size="small" className="mt-1 text-ui-fg-subtle">
          Controls storefront delivery promises and the PDP arrival estimate.
        </Text>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <Label htmlFor={`delivery-${field.key}`} className="text-xs">
              {field.label}
            </Label>
            <Input
              id={`delivery-${field.key}`}
              type="number"
              size="small"
              min={field.min}
              max={field.max}
              value={field.optional ? (value[field.key] ?? "") as string | number : Number(value[field.key] ?? 0)}
              disabled={disabled}
              onChange={(event) => updateField(field.key, event.target.value, field.optional)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
