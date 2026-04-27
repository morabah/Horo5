import { Terms } from "@/storefront/pages/Terms";
import { RouterContextProvider } from "@/lib/router-context";

export const revalidate = 86400;

export default function Page() {
  return (
    <RouterContextProvider>
      <Terms />
    </RouterContextProvider>
  );
}
