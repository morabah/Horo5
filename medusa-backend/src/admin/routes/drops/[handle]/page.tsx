import { Container, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"

import { DropForm } from "../../../components/drops/DropForm"
import { fetchDrop } from "../../../components/drops/api"

export default function EditDropPage() {
  const { handle = "" } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ["horo", "drops", "detail", handle],
    queryFn: () => fetchDrop(handle),
    enabled: Boolean(handle),
  })

  if (isLoading) {
    return (
      <Container className="mx-auto max-w-4xl p-6">
        <Text>Loading drop...</Text>
      </Container>
    )
  }

  if (error || !data?.drop) {
    return (
      <Container className="mx-auto max-w-4xl p-6">
        <Text className="text-ui-fg-error">Drop not found.</Text>
      </Container>
    )
  }

  return <DropForm mode="edit" initialDrop={data.drop} />
}
