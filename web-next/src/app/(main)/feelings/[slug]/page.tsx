"use client";

import { FeelingCollection } from "../../../../../../web/src/pages/FeelingCollection";
import { LegacyFeelingLineRedirect } from "@/components/legacy-feeling-line-redirect";
import { RouterContextProvider } from "@/lib/router-context";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  return (
    <RouterContextProvider params={params}>
      <LegacyFeelingLineRedirect />
      <FeelingCollection />
    </RouterContextProvider>
  );
}
