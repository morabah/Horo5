import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Gift, Link, Tag, TruckFast } from "@medusajs/icons"
import { Badge, Container, Heading, Tabs, Text } from "@medusajs/ui"

import { CartIncentivesTab } from "../../components/promotions-studio/tabs/CartIncentivesTab"
import { CrossSellTab } from "../../components/promotions-studio/tabs/CrossSellTab"
import { DiscountCodesTab } from "../../components/promotions-studio/tabs/DiscountCodesTab"
import { ProductDealsTab } from "../../components/promotions-studio/tabs/ProductDealsTab"

export default function PromotionsStudioPage() {
  return (
    <Container className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Heading level="h1">Promotions Studio</Heading>
            <Badge size="small" color="blue">native Medusa engine</Badge>
          </div>
          <Text size="small" className="mt-1 max-w-4xl text-ui-fg-subtle">
            Fashion-merchandiser controls for product deals, cart incentives, cross-sell slots, and code promotion visibility. Cart math and native code editing stay in Medusa.
          </Text>
        </div>
      </div>

      <Tabs defaultValue="product-deals">
        <Tabs.List className="mb-5">
          <Tabs.Trigger value="product-deals">
            <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4" /> Product Deals</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="cart-incentives">
            <span className="inline-flex items-center gap-2"><TruckFast className="h-4 w-4" /> Cart Incentives</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="cross-sell">
            <span className="inline-flex items-center gap-2"><Link className="h-4 w-4" /> Cross-sell & Upsell</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="discount-codes">
            <span className="inline-flex items-center gap-2"><Gift className="h-4 w-4" /> Discount Codes</span>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="product-deals">
          <ProductDealsTab />
        </Tabs.Content>
        <Tabs.Content value="cart-incentives">
          <CartIncentivesTab />
        </Tabs.Content>
        <Tabs.Content value="cross-sell">
          <CrossSellTab />
        </Tabs.Content>
        <Tabs.Content value="discount-codes">
          <DiscountCodesTab />
        </Tabs.Content>
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Promotions Studio",
  rank: 35,
  icon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
})
