import "./globals.css";

// HTML shell only. Catalog + Providers live in route-group layouts so `/checkout` can skip
// the heavy Medusa `/storefront/catalog` fetch (see `(main)/layout.tsx` and `(checkout)/layout.tsx`).

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
