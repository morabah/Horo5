/** Single place for restock notifications — swap for API when backend exists. */
export function notifyRestockSignup(payload: { productSlug: string; size: string; email: string }) {
  const key = `horo-pdp-notify-${payload.productSlug}-${payload.size}`;
  localStorage.setItem(key, payload.email);
  if (process.env.NODE_ENV === "development") {
    console.info('[PDP] notify restock', payload);
  }
}
