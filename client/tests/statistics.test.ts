import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStatistics, readCareer, careerKey } from '../src/statistics.ts'
import { Direction, Phase, type State } from '../src/types.ts'

const state = (overrides: Partial<State> = {}): State => ({ nickname: 'Pilot', connected: true, gameId: 1, tickNumber: 0, tickInterval: 150, phase: Phase.GAME, phaseInterval: 0, winnerId: -1, playerId: 0, arenaSize: 50,
  players: [0, 1, 2].map(id => ({ id, nickname: String(id), color: '#fff', connected: true, isAlive: true, direction: Direction.RIGHT, x: id * 5, y: 0, trace: [id * 5, 0], games: 0, wins: 0 })), ...overrides })

test('career records one defeat, actual distance and turns, and freezes survival at death', () => {
  let saves = 0
  const stats = createStatistics(undefined, () => saves++)
  const first = state(); stats.observe(first)
  const moved = state({ tickNumber: 10 }); moved.players[0].x = 10; stats.observe(moved)
  const turned = state({ tickNumber: 11 }); Object.assign(turned.players[0], {x: 10, y: 1, direction: Direction.DOWN}); stats.observe(turned)
  const dead = structuredClone(turned); dead.tickNumber = 12; dead.players[0].isAlive = false; stats.observe(dead)
  assert.equal(stats.career.races, 1); assert.equal(stats.career.wins, 0)
  assert.equal(stats.metrics.distance, 33); assert.equal(stats.metrics.turns, 1)
  assert.equal(stats.metrics.seconds, 1.8); assert.equal(stats.metrics.place, 3)
  dead.tickNumber = 100; dead.phase = Phase.WINNER; dead.winnerId = 1
  stats.observe(dead); stats.observe(dead); stats.abandon()
  assert.equal(saves, 1); assert.equal(stats.career.bestSeconds, 1.8)
})

test('career persists wins, advances streak, and records an abandoned race once', () => {
  const stats = createStatistics()
  stats.observe(state()); stats.observe(state({ tickNumber: 20, phase: Phase.WINNER, winnerId: 0 }))
  assert.equal(stats.career.wins, 1); assert.equal(stats.career.streak, 1)
  stats.observe(state({ gameId: 2 })); stats.observe(state({ gameId: 2, tickNumber: 30, phase: Phase.WINNER, winnerId: 0 }))
  assert.equal(stats.career.bestStreak, 2)
  stats.observe(state({ gameId: 3 })); stats.abandon(); stats.abandon()
  assert.equal(stats.career.races, 3); assert.equal(stats.career.streak, 0)
  const restored = readCareer(JSON.stringify(stats.career))
  assert.equal(restored.wins, 2); assert.equal(restored.history[0].result, 'quit')
  assert.notEqual(careerKey('Pilot', 'practice'), careerKey('Pilot', 'online'))
  assert.notEqual(careerKey('Pilot', 'practice'), careerKey('Other', 'practice'))
})

test('waiting and countdown do not count as races and bad storage is ignored', () => {
  const stats = createStatistics()
  stats.observe(state({ phase: Phase.PENDING })); stats.observe(state({ phase: Phase.READY })); stats.abandon()
  assert.equal(stats.career.races, 0)
  for (const raw of ['bad json', '{}', '{"races": -1}', 'null']) assert.equal(readCareer(raw).races, 0)
})

test('history is bounded without discarding aggregate career totals', () => {
  const stats = createStatistics()
  for (let i = 0; i < 12; i++) { stats.observe(state({ gameId: i })); stats.observe(state({ gameId: i, tickNumber: 2, phase: Phase.WINNER, winnerId: 0 })) }
  assert.equal(stats.career.history.length, 8); assert.equal(stats.career.races, 12); assert.equal(stats.career.wins, 12)
})
