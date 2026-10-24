import {
	draw,
	resize,
	handleInputs,
	createStore,
	createConnection,
	createMockConnection,
	type Mode,
	type ServerMessage,
} from "./src"

resize()
window.addEventListener("resize", resize)

const isMock = false

const endpoint = "ws://localhost:2026"
const nickname = "hlebaev"
const mode: Mode = "full"

const store = createStore(nickname)

const connection = isMock ? createMockConnection() : createConnection({
	endpoint,
	nickname,
	mode,
})

connection.onMessage((msg: ServerMessage) => {
	// store.tick()
	store.handle(msg)
	draw(store.state)
})

handleInputs(connection)
