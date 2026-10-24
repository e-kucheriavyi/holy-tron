import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialGarage, readGarage, openCase, equipSkin, rewardRace, rollSkin, CASE_PRICE, garageKey } from '../src/garage.ts'

test('free cases unlock the selected rarity and refund duplicates', () => {
  const account = initialGarage()
  const random = () => .98
  const first = openCase(account, random)!
  assert.equal(first.skin.rarity, 'legendary'); assert.equal(first.duplicate, false)
  assert.equal(account.coins, 300 - CASE_PRICE); assert.ok(account.owned.includes(first.skin.id))
  const second = openCase(account, random)!
  assert.equal(second.duplicate, true); assert.equal(second.refund, 60)
  assert.equal(account.coins, 360); assert.equal(account.opened, 2)
  account.coins = 0
  assert.ok(openCase(account, random))
  assert.equal(account.opened, 3); assert.equal(account.coins, 60)
})

test('rarity thresholds match the displayed 70/25/5 odds', () => {
  const pick = (first: number) => { let calls = 0; return () => calls++ ? .2 : first }
  assert.equal(rollSkin(pick(0)).rarity, 'standard')
  assert.equal(rollSkin(pick(.69999)).rarity, 'standard')
  assert.equal(rollSkin(pick(.7)).rarity, 'rare')
  assert.equal(rollSkin(pick(.94999)).rarity, 'rare')
  assert.equal(rollSkin(pick(.95)).rarity, 'legendary')
})

test('locked skins cannot be equipped, inventory persists, and profiles are isolated', () => {
  const account = initialGarage()
  assert.equal(equipSkin(account, 'prism'), false)
  openCase(account, () => .99)
  assert.equal(equipSkin(account, 'prism'), true)
  const restored = readGarage(JSON.stringify(account))
  assert.equal(restored.equipped, 'prism'); assert.equal(restored.coins, 300)
  assert.notEqual(garageKey('Pilot'), garageKey('Other'))
  assert.deepEqual(readGarage('broken'), initialGarage())
})

test('race rewards apply once per race, including zero-credit quits', () => {
  const account = initialGarage()
  assert.equal(rewardRace(account, 'race-1', 'win'), 100)
  assert.equal(rewardRace(account, 'race-1', 'win'), 0)
  assert.equal(rewardRace(account, 'race-2', 'loss'), 40)
  assert.equal(rewardRace(account, 'race-3', 'draw'), 60)
  assert.equal(rewardRace(account, 'race-4', 'quit'), 0)
  assert.equal(account.coins, 500)
})
