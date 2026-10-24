import { Direction, type Player } from "./types.ts"

export const collidePointWithPath = ([x, y]: [number, number], path: number[]): boolean => {
	for (let i = 0; i < path.length - 1; i += 2) {
		const a = [path[i], path[i + 1]]
		const b = [path[i + 2], path[i + 3]]

		if (a[1] === b[1]) {
			if (y !== a[1]) {
				continue
			}

			const minX = Math.min(a[0], b[0])
			const maxX = Math.max(a[0], b[0])

			if (x >= minX && x <= maxX) {
				return true
			}
		} else if (a[0] === b[0]) {
			if (x !== a[0]) {
				continue
			}

			const minY = Math.min(a[1], b[1])
			const maxY = Math.max(a[1], b[1])

			if (y >= minY && y <= maxY) {
				return true
			}
		}
	}

	return false
}

export const checkCollision = (players: Player[], index: number) => {
	const a = players[index]

	for (let i = 0; i < players.length; i++) {
		const b = players[i]

		if (!b.isAlive) {
			continue
		}

		const path = [...b.trace, b.x, b.y]

		if (i === index) {
			switch (b.direction) {
				case Direction.LEFT:  path[path.length-2] += 1; break
				case Direction.RIGHT: path[path.length-2] -= 1; break
				case Direction.UP:    path[path.length-1] += 1; break
				case Direction.DOWN:  path[path.length-1] -= 1; break
			}
		}

		if (
			collidePointWithPath(
				[a.x, a.y],
				path,
			)
		) {
			return true
		}
	}

	return false
}
