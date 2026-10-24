import type { Connection } from "./network.ts"
import { Direction } from "./types.ts"

const KEYMAP: Record<string, Direction> = {
	ArrowLeft:  Direction.LEFT,
	ArrowRight: Direction.RIGHT,
	ArrowUp:    Direction.UP,
	ArrowDown:  Direction.DOWN,
}

export const handleInputs = (connection: Connection) => {
	window.addEventListener("keydown", (e) => {
		if (e.repeat) {
			return
		}

		const d = KEYMAP[e.key]

		if (d) {
			connection.send(d)
		}
	})
}
