export type Rarity = 'standard' | 'rare' | 'legendary'
export type Skin = { id: string; name: string; color: string; paint: string; rarity: Rarity; finish: 'metal' | 'carbon' | 'holo' }
export const skins: Skin[] = [
  { id: 'factory', name: 'Factory Mint', color: '#86f8d8', paint: '#183a38', rarity: 'standard', finish: 'metal' },
  { id: 'ice', name: 'Arctic Circuit', color: '#90e5ff', paint: '#234962', rarity: 'standard', finish: 'metal' },
  { id: 'solar', name: 'Solar Flare', color: '#ffb35d', paint: '#674022', rarity: 'standard', finish: 'metal' },
  { id: 'ghost', name: 'Ghost Protocol', color: '#e2edf8', paint: '#26303d', rarity: 'standard', finish: 'carbon' },
  { id: 'sakura', name: 'Sakura Drift', color: '#ff87c1', paint: '#742e55', rarity: 'rare', finish: 'metal' },
  { id: 'ultraviolet', name: 'Ultraviolet', color: '#b99aff', paint: '#4a2f75', rarity: 'rare', finish: 'carbon' },
  { id: 'toxic', name: 'Toxic Velocity', color: '#c9ff59', paint: '#365c24', rarity: 'rare', finish: 'carbon' },
  { id: 'gold', name: 'Midas Touch', color: '#ffe697', paint: '#dba643', rarity: 'legendary', finish: 'metal' },
  { id: 'prism', name: 'Prism / 01', color: '#f99fff', paint: '#856fc4', rarity: 'legendary', finish: 'holo' },
]
export const CASE_PRICE = 0
export const rarityLabels: Record<Rarity, string> = { standard: 'СЕРИЙНЫЙ', rare: 'РЕДКИЙ', legendary: 'ЛЕГЕНДАРНЫЙ' }
export type Garage = { coins: number; owned: string[]; equipped: string; opened: number; rewarded: string[] }
export const initialGarage = (): Garage => ({ coins: 300, owned: ['factory'], equipped: 'factory', opened: 0, rewarded: [] })
export const garageKey = (pilot: string) => `tron-garage-v1:${encodeURIComponent(pilot.trim())}`
export const readGarage = (raw: string | null): Garage => {
  try {
    const data = JSON.parse(raw ?? '{}') as Garage
    if (!Number.isFinite(data.coins) || data.coins < 0 || !Number.isInteger(data.opened) || data.opened < 0 || !Array.isArray(data.owned) || !Array.isArray(data.rewarded)) return initialGarage()
    const owned = [...new Set(['factory', ...data.owned.filter(id => skins.some(skin => skin.id === id))])]
    return { coins: Math.floor(data.coins), owned, equipped: owned.includes(data.equipped) ? data.equipped : 'factory', opened: data.opened, rewarded: data.rewarded.filter(id => typeof id === 'string').slice(-100) }
  } catch { return initialGarage() }
}
export const rollSkin = (random = Math.random): Skin => {
  const roll = random()
  const rarity: Rarity = roll < .7 ? 'standard' : roll < .95 ? 'rare' : 'legendary'
  const pool = skins.filter(skin => skin.rarity === rarity && skin.id !== 'factory')
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}
export const openCase = (garage: Garage, random = Math.random) => {
  if (garage.coins < CASE_PRICE) return null
  const skin = rollSkin(random), duplicate = garage.owned.includes(skin.id), refund = duplicate ? 60 : 0
  garage.coins -= CASE_PRICE - refund; garage.opened++
  if (!duplicate) garage.owned.push(skin.id)
  return { skin, duplicate, refund }
}
export const equipSkin = (garage: Garage, id: string) => {
  if (!garage.owned.includes(id) || !skins.some(skin => skin.id === id)) return false
  garage.equipped = id; return true
}
export const rewardRace = (garage: Garage, id: string, result: string) => {
  if (garage.rewarded.includes(id)) return 0
  const reward = { win: 100, loss: 40, draw: 60, quit: 0 }[result] ?? 0
  garage.rewarded = [...garage.rewarded, id].slice(-100)
  garage.coins += reward; return reward
}
