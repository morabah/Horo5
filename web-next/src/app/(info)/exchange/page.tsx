import { Exchange } from "@/storefront/pages/Exchange";
import { RouterContextProvider } from "@/lib/router-context";

export const revalidate = 86400;

export default function Page() {
  return (
    <RouterContextProvider>
      <Exchange />
    </RouterContextProvider>
  );
}
