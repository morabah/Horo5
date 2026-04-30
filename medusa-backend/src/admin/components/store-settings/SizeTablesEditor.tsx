import { Button, Heading, Input, Label, Text } from "@medusajs/ui"
import { useMemo, useState } from "react"

import type {
  SizeTable,
  SizeTableFitModel,
  SizeTableMeasurement,
} from "../../../lib/store-settings/types"

type SizeTablesEditorProps = {
  value: Record<string, SizeTable>
  disabled?: boolean
  onChange: (value: Record<string, SizeTable>) => void
}

const MEASUREMENT_FIELDS: Array<keyof SizeTableMeasurement> = ["size", "chest", "shoulder", "length", "sleeve"]
const FIT_MODEL_FIELDS: Array<keyof SizeTableFitModel> = ["heightCm", "heightImperial", "sizeWorn", "fitNote"]

function emptyMeasurement(): SizeTableMeasurement {
  return { size: "", chest: "", shoulder: "", length: "", sleeve: "" }
}

function emptyFitModel(): SizeTableFitModel {
  return { heightCm: 170, heightImperial: "", sizeWorn: "", fitNote: "" }
}

function emptyTable(): SizeTable {
  return {
    measurements: [emptyMeasurement()],
    fitModels: [],
  }
}

function tableLabel(key: string) {
  return key
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function SizeTablesEditor({ value, disabled, onChange }: SizeTablesEditorProps) {
  const [newKey, setNewKey] = useState("")
  const tableKeys = useMemo(() => Object.keys(value).sort(), [value])

  const updateTable = (key: string, table: SizeTable) => {
    onChange({ ...value, [key]: table })
  }

  const removeTable = (key: string) => {
    const next = { ...value }
    delete next[key]
    onChange(next)
  }

  const addTable = () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "-")
    if (!key || value[key]) return
    onChange({ ...value, [key]: emptyTable() })
    setNewKey("")
  }

  const updateMeasurement = (
    tableKey: string,
    index: number,
    field: keyof SizeTableMeasurement,
    nextValue: string,
  ) => {
    const table = value[tableKey]
    if (!table) return
    const measurements = [...table.measurements]
    measurements[index] = { ...measurements[index], [field]: nextValue }
    updateTable(tableKey, { ...table, measurements })
  }

  const updateFitModel = (
    tableKey: string,
    index: number,
    field: keyof SizeTableFitModel,
    nextValue: string,
  ) => {
    const table = value[tableKey]
    if (!table) return
    const fitModels = [...table.fitModels]
    const current = fitModels[index] ?? emptyFitModel()
    fitModels[index] = {
      ...current,
      [field]: field === "heightCm" ? Number(nextValue || 0) : nextValue,
    }
    updateTable(tableKey, { ...table, fitModels })
  }

  return (
    <section className="rounded-md border border-ui-border-base p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading level="h2">Size Tables</Heading>
          <Text size="small" className="mt-1 text-ui-fg-subtle">
            Named presets used by product PDP size-guide selection.
          </Text>
        </div>
        <div className="flex min-w-[260px] items-end gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="new-size-table-key" className="text-xs">
              New table key
            </Label>
            <Input
              id="new-size-table-key"
              size="small"
              value={newKey}
              disabled={disabled}
              placeholder="boxy"
              onChange={(event) => setNewKey(event.target.value)}
            />
          </div>
          <Button type="button" size="small" variant="secondary" disabled={disabled || !newKey.trim()} onClick={addTable}>
            Add
          </Button>
        </div>
      </div>

      <div className="grid gap-5">
        {tableKeys.length === 0 ? (
          <div className="rounded-md border border-dashed border-ui-border-base p-6 text-center">
            <Text size="small" className="text-ui-fg-muted">
              Add at least one size table before saving.
            </Text>
          </div>
        ) : null}

        {tableKeys.map((key) => {
          const table = value[key]
          return (
            <div key={key} className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Heading level="h3">{tableLabel(key) || key}</Heading>
                  <Text size="xsmall" className="font-mono text-ui-fg-muted">
                    {key}
                  </Text>
                </div>
                <Button
                  type="button"
                  size="small"
                  variant="danger"
                  disabled={disabled || tableKeys.length <= 1}
                  onClick={() => removeTable(key)}
                >
                  Remove table
                </Button>
              </div>

              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Text size="small" weight="plus">
                    Measurements
                  </Text>
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => updateTable(key, { ...table, measurements: [...table.measurements, emptyMeasurement()] })}
                  >
                    Add row
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border border-ui-border-base bg-ui-bg-base">
                  <table className="min-w-[720px] w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                        {MEASUREMENT_FIELDS.map((field) => (
                          <th key={field} className="px-3 py-2 font-medium capitalize text-ui-fg-base">
                            {field}
                          </th>
                        ))}
                        <th className="w-24 px-3 py-2 text-right font-medium text-ui-fg-base">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.measurements.map((row, index) => (
                        <tr key={`${key}-measurement-${index}`} className="border-b border-ui-border-base last:border-0">
                          {MEASUREMENT_FIELDS.map((field) => (
                            <td key={field} className="px-2 py-2">
                              <Input
                                size="small"
                                value={row[field]}
                                disabled={disabled}
                                onChange={(event) => updateMeasurement(key, index, field, event.target.value)}
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2 text-right">
                            <Button
                              type="button"
                              size="small"
                              variant="secondary"
                              disabled={disabled || table.measurements.length <= 1}
                              onClick={() => {
                                const measurements = table.measurements.filter((_, rowIndex) => rowIndex !== index)
                                updateTable(key, { ...table, measurements })
                              }}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Text size="small" weight="plus">
                    Fit Models
                  </Text>
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => updateTable(key, { ...table, fitModels: [...table.fitModels, emptyFitModel()] })}
                  >
                    Add model
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border border-ui-border-base bg-ui-bg-base">
                  <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                        {FIT_MODEL_FIELDS.map((field) => (
                          <th key={field} className="px-3 py-2 font-medium text-ui-fg-base">
                            {field}
                          </th>
                        ))}
                        <th className="w-24 px-3 py-2 text-right font-medium text-ui-fg-base">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.fitModels.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-ui-fg-muted">
                            No fit models.
                          </td>
                        </tr>
                      ) : (
                        table.fitModels.map((model, index) => (
                          <tr key={`${key}-model-${index}`} className="border-b border-ui-border-base last:border-0">
                            {FIT_MODEL_FIELDS.map((field) => (
                              <td key={field} className="px-2 py-2">
                                <Input
                                  size="small"
                                  type={field === "heightCm" ? "number" : "text"}
                                  value={String(model[field] ?? "")}
                                  disabled={disabled}
                                  onChange={(event) => updateFitModel(key, index, field, event.target.value)}
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2 text-right">
                              <Button
                                type="button"
                                size="small"
                                variant="secondary"
                                disabled={disabled}
                                onClick={() => {
                                  const fitModels = table.fitModels.filter((_, modelIndex) => modelIndex !== index)
                                  updateTable(key, { ...table, fitModels })
                                }}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
