import { Input, Label } from "@medusajs/ui"

type BilingualInputProps = {
  id: string
  label: string
  valueEn: string | null
  valueAr: string | null
  disabled?: boolean
  onChange: (en: string | null, ar: string | null) => void
}

export function BilingualInput({ id, label, valueEn, valueAr, disabled, onChange }: BilingualInputProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-en`} className="text-xs">
          {label} (EN)
        </Label>
        <Input
          id={`${id}-en`}
          size="small"
          value={valueEn ?? ""}
          disabled={disabled}
          placeholder="English"
          onChange={(e) => onChange(e.target.value || null, valueAr)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-ar`} className="text-xs">
          {label} (AR)
        </Label>
        <Input
          id={`${id}-ar`}
          size="small"
          value={valueAr ?? ""}
          disabled={disabled}
          placeholder="العربية"
          onChange={(e) => onChange(valueEn, e.target.value || null)}
        />
      </div>
    </div>
  )
}
