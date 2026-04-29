import { Badge, Button, Input } from "@medusajs/ui"
import { XMarkMini } from "@medusajs/icons"
import { useState } from "react"

type ChipInputProps = {
  values: string[]
  placeholder?: string
  onChange: (values: string[]) => void
}

export function ChipInput({ values, placeholder, onChange }: ChipInputProps) {
  const [draft, setDraft] = useState("")

  const add = () => {
    const parts = draft
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
    if (!parts.length) return
    onChange([...new Set([...values, ...parts])])
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          size="small"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button size="small" variant="secondary" type="button" onClick={add}>
          Add
        </Button>
      </div>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} size="small" color="grey" className="gap-1">
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                <XMarkMini />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
