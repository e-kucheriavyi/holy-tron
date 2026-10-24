export const CELLS_PER_PLAYER = 10

export const PHASE_INTERVAL = 5000

export const TICK_INTERVAL = 100

export const DEBUG = true

export const COLORS = Array.from({ length: 1000 }, (_, index) => {
	const hue = (index * 137.508) % 360
	const lightness = index % 2 === 0 ? 52 : 68

	return `hsl(${hue.toFixed(1)} 78% ${lightness}%)`
})
