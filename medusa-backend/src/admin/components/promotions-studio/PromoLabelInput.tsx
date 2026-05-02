import { Input, Label } from "@medusajs/ui"

export type PromoLabelInputValue = {
  en: string
  ar: string
}

type PromoLabelInputProps = {
  value: PromoLabelInputValue
  disabled?: boolean
  idPrefix: string
  required?: boolean
  onChange: (value: PromoLabelInputValue) => void
}

export function PromoLabelInput({
  value,
  disabled,
  idPrefix,
  required,
  onChange,
}: PromoLabelInputProps) {
  return (
    <div className="grid min-w-[280px] flex-1 gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-label-en`} className="text-xs">
          Promo label EN {required ? <span className="text-ui-fg-error">*</span> : null}
        </Label>
        <Input
          id={`${idPrefix}-label-en`}
          size="small"
          value={value.en}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, en: event.target.value })}
          placeholder='e.g. "Eid Sale"'
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-label-ar`} className="text-xs">
          Promo label AR
        </Label>
        <Input
          id={`${idPrefix}-label-ar`}
          size="small"
          value={value.ar}
          dir="rtl"
          disabled={disabled}
          onChange={(event) => onChange({ ...value, ar: event.target.value })}
          placeholder="مثال: خصم العيد"
        />
      </div>
    </div>
  )
}
