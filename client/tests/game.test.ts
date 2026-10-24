import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPracticeConnection } from '../src/practice.ts'
import { createStore } from '../src/store.ts'
import { ActionType, Direction, Phase, type State, type ServerMessage } from '../src/types.ts'

const snapshot = (message: ServerMessage) => message.a[0].d as State

test('practice counts down, accepts a turn, rejects reversal, and stops cleanly', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const connection = createPracticeConnection('Test pilot')
  let state!: State, packets = 0
  connection.onMessage(message => { state = snapshot(message); packets++ })
  await Promise.resolve()
  assert.equal(state.players.length, 4)
  assert.equal(state.phase, Phase.READY)
  t.mock.timers.tick(3105)
  assert.equal(state.phase, Phase.GAME)
  connection.send(Direction.LEFT)
  t.mock.timers.tick(115)
  assert.equal(state.players[0].direction, Direction.RIGHT)
  connection.send(Direction.DOWN)
  t.mock.timers.tick(115)
  assert.equal(state.players[0].direction, Direction.DOWN)
  assert.equal(state.players[0].y, 15)
  assert.deepEqual(state.players[0].trace.slice(-2), [10, 14])
  const previous = packets
  connection.close()
  t.mock.timers.tick(1000)
  assert.equal(packets, previous)
})

test('practice kills a pilot at the boundary and awards exactly one win', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const connection = createPracticeConnection('Wall tester')
  let state!: State
  connection.onMessage(message => { state = snapshot(message) })
  await Promise.resolve()
  t.mock.timers.tick(3105 + 115 * 43)
  assert.equal(state.players[0].isAlive, false)
  for (let i = 0; i < 3000 && state.phase === Phase.GAME; i++) t.mock.timers.tick(115)
  assert.equal(state.phase, Phase.WINNER)
  const winners = state.players.filter(p => p.isAlive)
  assert.ok(winners.length <= 1)
  assert.equal(state.winnerId, winners[0]?.id ?? -1)
  const wins = state.players.reduce((sum, p) => sum + p.wins, 0)
  assert.equal(wins, winners.length)
  t.mock.timers.tick(1000)
  assert.equal(state.players.reduce((sum, p) => sum + p.wins, 0), wins)
  connection.close()
})

test('full snapshots preserve pilot zero, nickname, server arena, and packet number', () => {
  const store = createStore('Initial')
  store.handle({ i: 42, t: 0, a: [{ t: ActionType.DATA, d: {
    playerId: 0, gameId: 4, phase: Phase.GAME, cellPerPlayer: 10,
    players: [{ id: 0, nickname: '<b>Pilot</b>', connected: true, isAlive: true, x: 5, y: 5, direction: Direction.RIGHT, trace: [5, 5], wins: 2, games: 4, color: '#fff' },
      { id: 1, nickname: 'Bot', connected: true, isAlive: false, x: 6, y: 5, direction: Direction.RIGHT, trace: [6, 5], wins: 0, games: 4, color: '#fff' }],
  } }] })
  assert.equal(store.state.playerId, 0)
  assert.equal(store.state.nickname, '<b>Pilot</b>')
  assert.equal(store.state.arenaSize, 20)
  assert.equal(store.state.tickNumber, 42)
  store.tick()
  assert.equal(store.state.players[0].x, 6)
  assert.equal(store.state.players[1].x, 6)
})

test('a new-round pilot event restores life and updates score without duplicates', () => {
  const store = createStore('Pilot')
  const player = { i: 0, n: 'Pilot', c: '#fff', d: Direction.RIGHT, x: 5, y: 5, w: 0, g: 0 }
  store.handle({ i: 0, t: 0, a: [{ t: ActionType.WELCOME, d: { i: 0, g: 0, s: 200, a: 10, p: [player] } }] })
  store.handle({ i: 1, t: 0, a: [{ t: ActionType.PLAYER_DIED, d: 0 }, { t: ActionType.GAME_PHASE, d: { p: Phase.END, n: 0, w: -1 } }] })
  store.handle({ i: 2, t: 0, a: [{ t: ActionType.PLAYER_CONNECTED, d: { ...player, w: 1, g: 1 } }] })
  assert.equal(store.state.players.length, 1)
  assert.equal(store.state.players[0].isAlive, true)
  assert.equal(store.state.players[0].wins, 1)
  assert.equal(store.state.players[0].games, 1)
})

test('online handshake retries between rounds, stops on a snapshot, and closes cleanly', async t => {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] })
  const OriginalWebSocket = globalThis.WebSocket
  const sockets: FakeSocket[] = []
  class FakeSocket extends EventTarget {
    static OPEN = 1
    readyState = 0
    sent: string[] = []
    constructor(_url: URL) { super(); sockets.push(this) }
    send(message: string) { this.sent.push(message) }
    close() { this.readyState = 3; this.dispatchEvent(new Event('close')) }
  }
  globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket
  t.after(() => { globalThis.WebSocket = OriginalWebSocket })
  const { createConnection } = await import('../src/network.ts')
  const statuses: string[] = []
  const connection = createConnection({ endpoint: 'ws://localhost:2026', nickname: 'Pilot', mode: 'full', onStatus: status => statuses.push(status) })
  let packets = 0
  connection.onMessage(() => packets++)
  const socket = sockets[0]
  connection.send('u')
  assert.equal(socket.sent.length, 0)
  socket.readyState = FakeSocket.OPEN; socket.dispatchEvent(new Event('open'))
  assert.deepEqual(socket.sent, ['f:Pilot'])
  t.mock.timers.tick(1500)
  assert.deepEqual(socket.sent, ['f:Pilot', 'f:Pilot'])
  socket.dispatchEvent(new MessageEvent('message', { data: 'broken json' }))
  assert.equal(packets, 0)
  socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({i: 1, t: 0, a: [{t: ActionType.DATA, d: {}}]}) }))
  assert.deepEqual(statuses, ['connecting', 'waiting', 'connected'])
  assert.equal(packets, 1)
  t.mock.timers.tick(45000)
  assert.equal(socket.sent.length, 2)
  connection.send('u')
  assert.equal(socket.sent.at(-1), 'u')
  connection.close()
  assert.equal(socket.readyState, 3)
  assert.deepEqual(statuses, ['connecting', 'waiting', 'connected'])
})
