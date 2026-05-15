import Link from "next/link";

export function StoreFooter() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-black/70 md:px-8">
        <p className="font-medium text-black">HORO</p>
        <p>Wearable art with proof-first trust and gift-worthy presentation.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/exchange">Exchange</Link>
          <Link href="/size-guide">Size guide</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
