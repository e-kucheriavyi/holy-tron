import WebSocket, { WebSocketServer } from "ws"
import {
	Direction,
	Phase,
	ActionType,
	type Client,
	type ServerMessage,
	type Game,
	type GameServer,
} from "./types.ts"

export const createServer = (game: Game) => {
	const spectators: WebSocket[] = []
	const clientsById: Record<number, Client> = {}

	const wss = new WebSocketServer({ port: 2026 })

	const broadcast = (msg: ServerMessage) => {
		const tickString = JSON.stringify(msg)

		const players = game.state.players.filter((p) => p.connected)

		Object.keys(clientsById).forEach((id, _) => {
			const client = clientsById[Number(id)] as Client

			if (client.ws.readyState !== WebSocket.OPEN) {
				return
			}

			if (client.mode === "full") {
				const stateString = JSON.stringify({
					t: Date.now(),
					i: game.state.ticks.length - 1,
					a: [
						{
							t: ActionType.DATA,
							d: {
								...game.state,
								players,
								ticks: undefined,
								playerId: Number(id),
							},
						},
					],
				})
				client.ws.send(stateString)
				return
			}
			client.ws.send(tickString)
		})

		const stateString = JSON.stringify({
			t: Date.now(),
			i: game.state.ticks.length - 1,
			a: [
				{
					t: ActionType.DATA,
					d: {
						...game.state,
						players,
						ticks: undefined,
						playerId: -1,
					},
				},
			],
		})

		spectators.forEach((s) => {
			if (s.readyState === WebSocket.OPEN) {
				s.send(stateString)
			}
		})
	}

	const send = (id: number, msg: ServerMessage) => {
		const client = clientsById[id]

		if (!client || !client.ws || client.ws.readyState !== WebSocket.OPEN) {
			console.log("no ws for ", id)
			return
		}

		client.ws.send(JSON.stringify(msg))
	}

	const server: GameServer = {
		clientsById,
		broadcast,
		send,
	}

	wss.on("error", console.error)

	wss.on("open", (event) => {
		console.log("[OPEN]", event)
	})

	wss.on("connection", (ws) => {
		let id = -1

		ws.on("error", console.error)

		ws.on("message", (data) => {
			const msg = String(data)
			console.log(msg)

			if (id === -1) {
				if (game.state.phase === Phase.PENDING) {
					const [mode, nickname] = msg.split(":")
					id = game.connect(server, ws, nickname)
					if (id === -1) {
						spectators.push(ws)
					} else {
						clientsById[id] = {
							ws,
							mode: mode === "f" ? "full" : "ticks",
						}
					}
					return
				}
				spectators.push(ws)
				return
			}

			game.turn(id, msg as Direction)
		})

		ws.on("close", () => {
			game.disconnect(server, id)
		})
	})

	return server
}
