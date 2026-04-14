# Admin Customizations

You can extend the Medusa Admin to add widgets and new pages. Your customizations interact with API routes to provide merchants with custom functionalities.

> Learn more about Admin Extensions in [this documentation](https://docs.medusajs.com/learn/fundamentals/admin).

## PDP size guide preset (product widget)

[`widgets/product-size-table-key.tsx`](widgets/product-size-table-key.tsx) adds a **dropdown on the product details page** that sets `metadata.sizeTableKey` (store presets come from `npm run apply:size-tables-metadata`). Options are loaded from [`GET /admin/custom/storefront-size-table-options`](../api/admin/custom/storefront-size-table-options/route.ts).

**Local dev:** set in `medusa-backend/.env` (used when building/serving admin):

```bash
VITE_BACKEND_URL=http://localhost:9000
```

Use the same origin as your Medusa server so the JS SDK (`src/admin/lib/sdk.ts`) can call `/admin/*` with session cookies. Restart `medusa develop` after changing env.

## Example: Create a Widget

A widget is a React component that can be injected into an existing page in the admin dashboard.

For example, create the file `src/admin/widgets/product-widget.tsx` with the following content:

```tsx title="src/admin/widgets/product-widget.tsx"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

// The widget
const ProductWidget = () => {
  return (
    <div>
      <h2>Product Widget</h2>
    </div>
  )
}

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductWidget
```

This inserts a widget with the text “Product Widget” at the end of a product’s details page.