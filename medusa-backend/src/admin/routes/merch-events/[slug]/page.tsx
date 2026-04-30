import { Container, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"

import { MerchEventForm } from "../../../components/merch-events/MerchEventForm"
import { sdk } from "../../../lib/sdk"
import type { AdminMerchEvent } from "../../../../lib/merch-events/types"

async function fetchMerchEvent(slug: string) {
  return sdk.client.fetch<{ event: AdminMerchEvent }>(`/admin/custom/merch-events/${encodeURIComponent(slug)}`, {
    method: "GET",
  })
}

export default function MerchEventDetailPage() {
  const { slug = "" } = useParams()
  const creating = slug === "new"

  const { data, isLoading, error } = useQuery({
    queryKey: ["horo", "merch-events", "detail", slug],
    queryFn: () => fetchMerchEvent(slug),
    enabled: Boolean(slug) && !creating,
  })

  if (creating) {
    return <MerchEventForm mode="create" />
  }

  if (isLoading) {
    return (
      <Container className="mx-auto max-w-4xl p-6">
        <Text>Loading merch event...</Text>
      </Container>
    )
  }

  if (error || !data?.event) {
    return (
      <Container className="mx-auto max-w-4xl p-6">
        <Text className="text-ui-fg-error">Merch event not found.</Text>
      </Container>
    )
  }

  return <MerchEventForm mode="edit" initialEvent={data.event} />
}
