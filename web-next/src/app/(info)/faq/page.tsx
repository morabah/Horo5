import { RouterContextProvider } from "@/lib/router-context";
import { FAQ } from "@/storefront/pages/FAQ";

export const revalidate = 86400;

export default function Page() {
  return (
    <RouterContextProvider>
      <FAQ />
    </RouterContextProvider>
  );
}
