/**
 * HORO metaobject definitions.
 * Aligned with docs/shopify-final-admin-data-model-lock.md §1.
 */

export interface MetaobjectFieldDef {
  key: string;
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  validations?: Array<{ name: string; value?: string }>;
}

export interface MetaobjectDef {
  type: string;
  name: string;
  fieldDefinitions: MetaobjectFieldDef[];
}

const _feeling: MetaobjectDef = {
  type: 'feeling',
  name: 'Feeling',
  fieldDefinitions: [
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
    { key: 'description', name: 'Description', type: 'multi_line_text_field' },
    { key: 'tagline', name: 'Tagline', type: 'single_line_text_field' },
    { key: 'accent_color', name: 'Accent color', type: 'color' },
    { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    { key: 'card_image', name: 'Card image', type: 'file_reference' },
    { key: 'manifesto', name: 'Manifesto', type: 'multi_line_text_field' },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
  ],
};

const _subfeeling: MetaobjectDef = {
  type: 'subfeeling',
  name: 'Subfeeling',
  fieldDefinitions: [
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
    { key: 'parent_feeling', name: 'Parent feeling', type: 'metaobject_reference', required: true, description: 'Reference to a feeling metaobject', validations: [{ name: 'metaobject_definition_id', value: 'feeling' }] },
    { key: 'description', name: 'Description', type: 'multi_line_text_field' },
    { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    { key: 'card_image', name: 'Card image', type: 'file_reference' },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
  ],
};

const _occasion: MetaobjectDef = {
  type: 'occasion',
  name: 'Occasion',
  fieldDefinitions: [
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
    { key: 'description', name: 'Description', type: 'multi_line_text_field' },
    { key: 'accent_color', name: 'Accent color', type: 'color' },
    { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    { key: 'card_image', name: 'Card image', type: 'file_reference' },
    { key: 'is_gift_occasion', name: 'Is gift occasion', type: 'boolean', required: true },
    { key: 'price_hint', name: 'Price hint', type: 'single_line_text_field' },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
  ],
};

const _artist: MetaobjectDef = {
  type: 'artist',
  name: 'Artist',
  fieldDefinitions: [
    { key: 'name', name: 'Name', type: 'single_line_text_field', required: true },
    { key: 'slug', name: 'Slug', type: 'single_line_text_field', required: true },
    { key: 'style', name: 'Style', type: 'single_line_text_field' },
    { key: 'bio', name: 'Bio', type: 'multi_line_text_field' },
    { key: 'avatar', name: 'Avatar', type: 'file_reference' },
    { key: 'portfolio_url', name: 'Portfolio URL', type: 'url' },
    { key: 'design_count', name: 'Design count', type: 'number_integer' },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
  ],
};

const _sizeTable: MetaobjectDef = {
  type: 'size_table',
  name: 'Size table',
  fieldDefinitions: [
    { key: 'name', name: 'Name', type: 'single_line_text_field', required: true },
    { key: 'unit_system', name: 'Unit system', type: 'single_line_text_field' },
    { key: 'rows', name: 'Rows', type: 'json', required: true, description: 'JSON array of size objects, e.g. [{"size":"S","chest":"52"}]' },
    { key: 'note', name: 'Note', type: 'multi_line_text_field' },
  ],
};

const _drop: MetaobjectDef = {
  type: 'drop',
  name: 'Drop',
  fieldDefinitions: [
    { key: 'name', name: 'Name', type: 'single_line_text_field', required: true },
    { key: 'slug', name: 'Slug', type: 'single_line_text_field', required: true },
    { key: 'status', name: 'Status', type: 'single_line_text_field', required: true, description: 'coming_soon, live, or ended' },
    { key: 'teaser', name: 'Teaser', type: 'multi_line_text_field' },
    { key: 'body', name: 'Body', type: 'rich_text_field' },
    { key: 'launch_at', name: 'Launch at', type: 'date_time', required: true },
    { key: 'end_at', name: 'End at', type: 'date_time' },
    { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    { key: 'products', name: 'Products', type: 'list.product_reference' },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
  ],
};

/**
 * Core metaobjects always seeded.
 */
export const CORE_METAOBJECTS: MetaobjectDef[] = [
  _feeling,
  _subfeeling,
  _occasion,
  _artist,
  _sizeTable,
];

/**
 * Optional metaobjects (e.g., drop for Phase 2C).
 */
export const OPTIONAL_METAOBJECTS: MetaobjectDef[] = [
  _drop,
];
