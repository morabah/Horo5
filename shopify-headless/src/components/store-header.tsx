import Link from "next/link";

export function StoreHeader() {
  return (
    <header className="border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          HORO
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-black/70">
          <Link href="/">Home</Link>
          <Link href="/products">Shop</Link>
          <Link href="/cart">Cart</Link>
        </nav>
      </div>
    </header>
  );
}
