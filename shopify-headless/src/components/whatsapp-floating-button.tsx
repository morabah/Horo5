import { env } from "@/lib/env";

export function WhatsAppFloatingButton() {
  if (!env.NEXT_PUBLIC_WHATSAPP_URL) {
    return null;
  }

  const url = new URL(env.NEXT_PUBLIC_WHATSAPP_URL);
  if (!url.searchParams.has("text")) {
    url.searchParams.set("text", "Hi HORO team, I need help choosing a tee.");
  }

  return (
    <a
      href={url.toString()}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center justify-center rounded-full bg-[#143d35] px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0f2f29] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
      aria-label="Ask HORO on WhatsApp"
    >
      WhatsApp
    </a>
  );
}
