import { Label, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

type FieldProps = {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
      {error ? (
        <Text size="xsmall" className="text-ui-fg-error">
          {error}
        </Text>
      ) : null}
    </div>
  )
}
