import { Privacy } from "@/storefront/pages/Privacy";
import { RouterContextProvider } from "@/lib/router-context";

export const revalidate = 86400;

export default function Page() {
  return (
    <RouterContextProvider>
      <Privacy />
    </RouterContextProvider>
  );
}
