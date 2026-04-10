import { ReturnTracker } from "@/components/checkout/return-tracker";

type CheckoutReturnPageProps = {
  searchParams: Promise<{ status?: string }>;
};

function toStatus(input: string | undefined): "success" | "failed" | "cancelled" {
  if (input === "failed" || input === "cancelled") {
    return input;
  }
  return "success";
}

export default async function CheckoutReturnPage({ searchParams }: CheckoutReturnPageProps) {
  const { status } = await searchParams;
  const normalizedStatus = toStatus(status);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <ReturnTracker status={normalizedStatus} />
      <section className="rounded-2xl border border-black/10 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">
          {normalizedStatus === "success" && "Checkout returned"}
          {normalizedStatus === "failed" && "Payment failed"}
          {normalizedStatus === "cancelled" && "Checkout cancelled"}
        </h1>
        <p className="mt-3 text-black/70">
          {normalizedStatus === "success" &&
            "The shopper returned from Shopify checkout. Treat payment as unverified until the orders/paid webhook is recorded on the server."}
          {normalizedStatus === "failed" &&
            "Try another payment method and verify both gateway logs and Shopify webhook delivery for the failure reason."}
          {normalizedStatus === "cancelled" &&
            "You can return to cart and continue checkout when ready."}
        </p>
        <p className="mt-4 text-sm text-black/50">
          This page is informational only. The authoritative paid-order signal is the signed Shopify webhook, not the browser redirect.
        </p>
      </section>
    </main>
  );
}
