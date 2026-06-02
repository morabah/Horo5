type HoroBrandMarkProps = {
  variant?: "dark" | "light"
  height?: number
  className?: string
}

/** Medusa Admin brand mark — served from backend `/static/horo-wordmark-*.png`. */
export function HoroBrandMark({
  variant = "dark",
  height = 26,
  className = "",
}: HoroBrandMarkProps) {
  const src = variant === "light" ? "/static/horo-wordmark-light.png" : "/static/horo-wordmark-dark.png"
  const width = Math.round(height * (943 / 215))

  return (
    <img
      src={src}
      alt="HORO"
      width={width}
      height={height}
      className={className}
      style={{ display: "block", width: "auto", height, maxWidth: "100%", objectFit: "contain" }}
    />
  )
}
