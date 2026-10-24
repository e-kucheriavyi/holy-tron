import type { ServerMessage } from "./types.ts"

export interface Connection {
	send: (msg: string) => void
	onMessage: (fn: (msg: ServerMessage) => void) => void
}

export type ConnectionOptions = {
	endpoint?: string
	nickname?: string
	mode?: "full" | "ticks"
}

export const createConnection = ({
	endpoint = "ws://localhost:2026",
	nickname = "hlebaev",
	mode = "ticks",
}: ConnectionOptions): Connection => {
	const ws = new WebSocket(endpoint)

	ws.addEventListener("open", () => {
		ws.send(`${mode === "full" ?'f' : 't'}:${nickname}`)
	})

	return {
		send: (msg) => {
			ws.send(msg)
		},
		onMessage: (fn) => {
			ws.addEventListener("message", (event) => {
				const msg = JSON.parse(event.data) as ServerMessage
				fn(msg)
			})
		},
	}
}
