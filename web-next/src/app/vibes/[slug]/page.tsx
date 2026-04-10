import { redirect } from "next/navigation";

const map: Record<string, string> = {
  emotions: "soft-quiet",
  zodiac: "warm-romantic",
  fiction: "playful-offbeat",
  career: "grounded-everyday",
  trends: "bold-electric",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/feelings/${map[slug] || slug}`);
}
