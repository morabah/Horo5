import { toSafeHandle } from '../utils/safe-handle.js';

export interface SizeTableInput {
  name: string;
  handle?: string;
  unit_system?: string;
  rows: Array<Record<string, string>>;
  note?: string;
}

export interface SizeTableOutput {
  handle: string;
  fields: Array<{ key: string; value: string }>;
}

export function mapSizeTable(input: SizeTableInput): SizeTableOutput {
  const handle = input.handle ?? toSafeHandle(input.name);

  return {
    handle,
    fields: [
      { key: 'name', value: input.name },
      { key: 'handle', value: handle },
      { key: 'unit_system', value: input.unit_system ?? 'cm' },
      { key: 'rows', value: JSON.stringify(input.rows) },
      { key: 'note', value: input.note ?? '' },
    ],
  };
}
