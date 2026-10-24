import { Direction } from "./types.ts"

export const isOppositeTurn = (a: Direction, b: Direction): boolean => {
	return (a === Direction.LEFT && b === Direction.RIGHT)
	|| (a === Direction.RIGHT && b === Direction.LEFT)
	|| (a === Direction.UP && b === Direction.DOWN)
	|| (a === Direction.DOWN && b === Direction.UP)
}
