# Drops Studio

Drops Studio lives inside the Medusa admin sidebar under **Drops**.

## Create one drop

1. Open **Drops**.
2. Click **New Drop**.
3. Fill identity, story, classification, commerce, and lifecycle fields.
4. Add existing occasions/artists from the dropdowns, or use **+ Create** beside the field when the slug is missing.
5. Drag images or a folder into **Media**, paste an image from the clipboard, or paste a direct image URL.
6. Tag exactly one image as **Main**. Extra main tags are blocked by the shared validator.
7. Click **Save draft** or **Publish**.

Drafts keep a stable handle and can be previewed from the form when `HORO_STOREFRONT_DRAFT_PREVIEW=1` is enabled on Medusa; preview requests use `/products/<handle>?preview=1` and bypass the public PDP cache. Publishing uses the same shared drop service as `npm run import:drops`.
If you navigate away with unsaved form edits, the admin prompts before leaving.

## Edit, duplicate, archive

- **Edit** opens the same form with the existing drop prefilled.
- **Duplicate** creates a draft copy with the existing media and metadata.
- **Archive** sets the Medusa product to draft and marks `metadata.archived=true`; the UI does not delete products.

## Bulk endpoint

`POST /admin/custom/drops/bulk` accepts `{ "drops": [...] }`, runs the same single-drop service with concurrency limiting, and returns per-row success or validation errors. The visual bulk page is intentionally thin until the single-drop workflow is validated by the team.

## Implementation notes

- `src/lib/drops/upsert-drop.ts` is the single product create/update path for the admin API and `npm run import:drops`.
- Existing drop edits reconcile selected sizes with Medusa variants, including prices, stock-tracking flags, and default-location inventory levels when `stockPerSize` is present.
- Apparel and feeling category links are treated as Drops-managed category assignments and are refreshed on edit instead of only appended.
