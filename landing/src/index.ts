import {
	draw,
	resize,
	handleInputs,
	createStore,
	createConnection,
	createMockConnection,
	type ServerMessage,
} from "@laranatech/tron-client"

resize()
window.addEventListener("resize", resize)

const isMock = false

const endpoint = "wss://tron.larana.tech/ws"
const nickname = "hlebaev"
const mode = "full"

const store = createStore(nickname)

const connection = isMock ? createMockConnection() : createConnection({
	ENDPOINT,
	nickname,
	mode,
})

connection.onMessage((msg: ServerMessage) => {
	store.tick()
	store.handle(msg)
	draw(store.state)
})

handleInputs(connection)
