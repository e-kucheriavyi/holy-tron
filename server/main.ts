import { createGame, createServer } from "./src/index.ts"

const game = createGame()

const server = createServer(game)

setInterval(() => {
	game.tick(server)
}, game.state.tickInterval)
