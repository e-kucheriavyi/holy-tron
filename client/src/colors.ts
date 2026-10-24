import { Color, SRGBColorSpace } from 'three'

// Server colors use CSS Color 4 space-separated HSL. Three's Color.setStyle expects commas.
export const playerColor = (value: string): Color => {
  const hsl = value.match(/^hsl\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*\)$/i)
  if (hsl) {
    const hue = ((Number(hsl[1]) % 360) + 360) % 360 / 360
    return new Color().setHSL(hue, Math.min(1, Number(hsl[2]) / 100), Math.min(1, Number(hsl[3]) / 100), SRGBColorSpace)
  }
  return new Color(value)
}
