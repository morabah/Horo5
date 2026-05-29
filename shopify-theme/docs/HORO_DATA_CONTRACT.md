# HORO Shopify Data Contract

Canonical source for product/collection metaobjects, metafields, fallback chains, and Medusa/web-next alignment.

**Namespace:** `custom` (do not migrate without an Admin migration plan).

**Liquid architecture:** Option A + C — component snippets for repeated markup; section-level assigns must match fallback chains here. Do **not** use `{% render %}` as a shared variable module.

See also: [`HORO_THEME_BASE.md`](../HORO_THEME_BASE.md).

---

## Incentives (theme settings)

| Setting | Purpose |
|---------|---------|
| `horo_incentives_live` | When `false` (default), cart free-shipping progress and bundle nudge do not render. Enable only after Shopify shipping/discount rules match cart copy and are tested at checkout. |

---

## Product metafields — fallback chains

| Field | Fallback chain | Notes |
|-------|----------------|-------|
| `fit_note` / `fit_label` / `size_fit_note` | `fit_note` → `fit_label` → `size_fit_note` | Single chain for fit copy |
| `story` / `story_description` | Canonical design narrative | |
| `design_story` | **Deprecated** → use `story` / `story_description` | Accordions fallback only |
| `proof_gallery` | Metaobject list → see Proof strip | |
| `review_proof` / `horo_ugc` | UGC gallery on PDP | |

Full Medusa mapping and metaobject field lists were consolidated here from the former `METAFIELD_WIRING.md`.

---

## Proof strip resolution

1. If `custom.proof_gallery` has items → use metaobjects.
2. Else scan media alt for `proof_fabric`, `proof_print`, `proof_wash`, `lifestyle`, `flat_lay`.
3. Else hide section (editor placeholder in design mode).

---

## Collection conventions

| Type | Handle pattern |
|------|----------------|
| Feeling | `feeling-{slug}` |
| Subfeeling | `feeling-{feeling}-{subfeeling}` |
| Occasion | `occasion-{slug}` |

Prefer metaobject `collection_url` over handle guessing.

---

## Hub pages (Admin)

| Page handle | Template |
|-------------|----------|
| `feelings` | `page.feelings` or `page.feelings-hub` |
| `occasions` | `page.occasions` or `page.occasions-hub` |
| `gifts-hub` | `page.gifts-hub` |

---

## Shopify Admin readiness checklist

- [ ] Metaobjects: `feeling`, `subfeeling`, `occasion`, `artist`, `size_table`, `proof_item`, `ugc_proof`
- [ ] Product metafields under `custom`
- [ ] Collections with strict handles
- [ ] Hub pages + correct templates
- [ ] Gift-wrap product in `horo_gift_wrap_product`
- [ ] Search synonyms in Search & Discovery (reference `data/search-synonyms.json`)
- [ ] EN/AR locales reviewed
- [ ] Payment/shipping/COD copy matches checkout
- [ ] `horo_incentives_live` enabled only after rules tested
