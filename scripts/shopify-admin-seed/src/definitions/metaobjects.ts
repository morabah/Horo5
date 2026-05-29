/**
 * HORO metaobject definitions.
 * Aligned with shopify-theme/docs/HORO_DATA_CONTRACT.md and launch Admin guide.
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
    { key: 'name', name: 'Name', type: 'single_line_text_field', description: 'Fallback for title in cards' },
    { key: 'slug', name: 'Slug', type: 'single_line_text_field', required: true },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    { key: 'tagline', name: 'Tagline', type: 'single_line_text_field' },
    { key: 'description', name: 'Description', type: 'multi_line_text_field' },
    { key: 'blurb', name: 'Blurb', type: 'multi_line_text_field', description: 'Short card copy; theme falls back to description' },
    { key: 'manifesto', name: 'Manifesto', type: 'multi_line_text_field' },
    { key: 'card_image', name: 'Card image', type: 'file_reference' },
    { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    { key: 'accent_color', name: 'Accent color', type: 'color' },
    {
      key: 'collection',
      name: 'Collection',
      type: 'collection_reference',
      description: 'Preferred collection link; collection_url overrides when set',
    },
    { key: 'collection_url', name: 'Collection URL', type: 'url', description: 'Overrides collection reference when set' },
    { key: 'seo_title', name: 'SEO title', type: 'single_line_text_field' },
    { key: 'seo_description', name: 'SEO description', type: 'single_line_text_field' },
  ],
};

const _subfeeling: MetaobjectDef = {
  type: 'subfeeling',
  name: 'Subfeeling',
  fieldDefinitions: [
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
    { key: 'slug', name: 'Slug', type: 'single_line_text_field', required: true },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    {
      key: 'parent_feeling',
      name: 'Parent feeling',
      type: 'metaobject_reference',
      required: true,
      validations: [{ name: 'metaobject_definition_id', value: 'feeling' }],
    },
    { key: 'feeling_slug', name: 'Feeling slug', type: 'single_line_text_field', description: 'Legacy parent key when reference is unset' },
    { key: 'description', name: 'Description', type: 'multi_line_text_field' },
    { key: 'blurb', name: 'Blurb', type: 'multi_line_text_field' },
    { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    { key: 'card_image', name: 'Card image', type: 'file_reference' },
    { key: 'collection_url', name: 'Collection URL', type: 'url' },
    { key: 'filter_url', name: 'Filter URL', type: 'url', description: 'Optional search/collection filter link' },
  ],
};

const _occasion: MetaobjectDef = {
  type: 'occasion',
  name: 'Occasion',
  fieldDefinitions: [
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
    { key: 'slug', name: 'Slug', type: 'single_line_text_field', required: true },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    { key: 'tagline', name: 'Tagline', type: 'single_line_text_field' },
    { key: 'description', name: 'Description', type: 'multi_line_text_field' },
    { key: 'blurb', name: 'Blurb', type: 'multi_line_text_field' },
    { key: 'card_image', name: 'Card image', type: 'file_reference' },
    { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    { key: 'accent_color', name: 'Accent color', type: 'color' },
    {
      key: 'collection',
      name: 'Collection',
      type: 'collection_reference',
      description: 'Preferred collection link; collection_url overrides when set',
    },
    { key: 'collection_url', name: 'Collection URL', type: 'url', description: 'Overrides collection reference when set' },
    { key: 'is_gift_occasion', name: 'Is gift occasion', type: 'boolean', required: true },
    { key: 'price_hint', name: 'Price hint', type: 'single_line_text_field' },
  ],
};

const _artist: MetaobjectDef = {
  type: 'artist',
  name: 'Artist',
  fieldDefinitions: [
    { key: 'name', name: 'Name', type: 'single_line_text_field', required: true },
    { key: 'display_name', name: 'Display name', type: 'single_line_text_field', description: 'Fallback for name on artist card' },
    { key: 'slug', name: 'Slug', type: 'single_line_text_field' },
    { key: 'style', name: 'Style', type: 'single_line_text_field' },
    { key: 'bio', name: 'Bio', type: 'multi_line_text_field', description: 'Use rich text in Admin if preferred; multi-line matches existing store' },
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
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true, description: 'Admin label e.g. HORO Regular T-Shirt Size Table' },
    { key: 'name', name: 'Name', type: 'single_line_text_field', description: 'Legacy alias for title' },
    { key: 'content', name: 'Content', type: 'rich_text_field', description: 'Rich text size table (recommended for launch)' },
    {
      key: 'rows',
      name: 'Rows',
      type: 'json',
      description:
        'Array of { size_label, chest, length, shoulder, sleeve } — size_label may alias as size',
    },
    { key: 'unit_system', name: 'Unit system', type: 'single_line_text_field' },
    { key: 'note', name: 'Note', type: 'multi_line_text_field' },
  ],
};

const _proofItem: MetaobjectDef = {
  type: 'proof_item',
  name: 'Proof item',
  fieldDefinitions: [
    { key: 'image', name: 'Image', type: 'file_reference', required: true },
    { key: 'tag', name: 'Tag', type: 'single_line_text_field', description: 'proof_fabric, proof_print, lifestyle, etc.' },
    { key: 'label', name: 'Label', type: 'single_line_text_field' },
    { key: 'caption', name: 'Caption', type: 'single_line_text_field' },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
  ],
};

const _ugcProof: MetaobjectDef = {
  type: 'ugc_proof',
  name: 'UGC proof',
  fieldDefinitions: [
    { key: 'product', name: 'Product', type: 'product_reference' },
    { key: 'image', name: 'Image', type: 'file_reference', required: true },
    { key: 'video_url', name: 'Video URL', type: 'url' },
    { key: 'body', name: 'Body', type: 'multi_line_text_field' },
    { key: 'rating', name: 'Rating', type: 'number_integer' },
    { key: 'instagram_handle', name: 'Instagram handle', type: 'single_line_text_field' },
    { key: 'permission_to_repost', name: 'Permission to repost', type: 'boolean' },
    { key: 'ugc_type', name: 'UGC type', type: 'single_line_text_field' },
    { key: 'source', name: 'Source', type: 'single_line_text_field' },
    { key: 'sort_order', name: 'Sort order', type: 'number_integer' },
    { key: 'active', name: 'Active', type: 'boolean', required: true },
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

export const CORE_METAOBJECTS: MetaobjectDef[] = [
  _feeling,
  _subfeeling,
  _occasion,
  _artist,
  _sizeTable,
  _proofItem,
  _ugcProof,
];

export const OPTIONAL_METAOBJECTS: MetaobjectDef[] = [_drop];
