import {
	draw,
	resize,
	handleInputs,
	createStore,
	createConnection,
	createMockConnection,
	type ServerMessage,
    Direction,
} from "@laranatech/tron-client"

resize()
window.addEventListener("resize", resize)

const isMock = false

const endpoint = "wss://tron.larana.tech/ws"
// const endpoint = "ws://gate3.hardshard.ru/ws"
const nickname = "hlebaev"
const mode = "full"

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

declare const up: HTMLButtonElement
declare const down: HTMLButtonElement
declare const left: HTMLButtonElement
declare const right: HTMLButtonElement

up.addEventListener("click", () => { connection.send(Direction.UP) })
down.addEventListener("click", () => { connection.send(Direction.DOWN) })
left.addEventListener("click", () => { connection.send(Direction.LEFT) })
right.addEventListener("click", () => { connection.send(Direction.RIGHT) })
