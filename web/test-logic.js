const providers = [{ id: "pp_system_default", is_enabled: true }];
const normalized = providers.filter((provider) => provider.id === "pp_system_default" || provider.id.includes("paymob"));

function resolveCheckoutPaymentMethodKind(providerId) {
  const normalizedStr = providerId.toLowerCase();
  if (!normalizedStr.includes("paymob")) return "cod";
  if (normalizedStr.includes("apple") || normalizedStr.includes("google")) return "wallet";
  return "card";
}

const isArabic = false;
const paymentMethods = normalized.map((provider) => {
    const kind = resolveCheckoutPaymentMethodKind(provider.id);

    if (kind === "cod") {
      return {
        id: provider.id,
        kind,
        label: isArabic ? "الدفع عند الاستلام" : "Cash on delivery (COD)",
        description: isArabic
          ? "الطريقة الأسرع. نؤكد الطلب مباشرة بعد حفظ البيانات."
          : "The fastest option. Your order is confirmed as soon as checkout is saved.",
      };
    }
    return null;
  });

console.log(paymentMethods);
