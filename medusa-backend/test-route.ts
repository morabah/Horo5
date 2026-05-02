import { config } from "dotenv";
config();
import fetch from "node-fetch";

async function run() {
  const adminUrl = "http://localhost:9000/admin/custom/promotions-studio/cart-incentives";
  // The route uses taxonomy-auth, so we need to bypass or provide the secret
  const secret = process.env.HORO_TAXONOMY_ADMIN_SECRET || "";
  
  const payload = {
    freeShipping: { thresholdEgp: 1500, label: { en: "Free Shipping", ar: "شحن مجاني" } },
    bundle: { enabled: true, requireQuantity: 2, applyToQuantity: 1, applicationKind: "percentage", applicationValue: 100, label: { en: "Bundle", ar: "عرض" } },
    giftWrap: null
  };

  const response = await fetch(adminUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-horo-taxonomy-secret": secret
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Response: ${text}`);
}
run();
