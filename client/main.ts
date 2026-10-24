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

const endpoint = "wss://tron.larana.tech/ws"
// const endpoint = "ws://gate3.hardshard.ru/ws"
const nickname = "hlebaev"
const mode: Mode = "full"

const store = createStore(nickname)

const connection = isMock ? createMockConnection() : createConnection({
	endpoint,
	nickname,
	mode,
})

connection.onMessage((msg: ServerMessage) => {
	// store.tick() // uncomment if mode === "ticks"
	store.handle(msg)
	draw(store.state)
})

handleInputs(connection)
