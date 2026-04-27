import { About } from "@/storefront/pages/About";
import { RouterContextProvider } from "@/lib/router-context";

export const revalidate = 86400;

export default function Page() {
  return (
    <RouterContextProvider>
      <About />
    </RouterContextProvider>
  );
}
