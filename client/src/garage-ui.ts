import { CASE_PRICE, skins, rarityLabels, garageKey, initialGarage, readGarage, openCase, equipSkin, rewardRace, type Skin } from './garage.ts'
import type { RaceRecord } from './statistics.ts'

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!
export const createGarageUI = (pilot: () => string, onEquip: (skin: Skin) => void) => {
  const dialog = $<HTMLDialogElement>('#garage-dialog')
  let profile = pilot(), key = garageKey(profile), garage = initialGarage(), opening = false
  const load = () => { key = garageKey(profile); try { garage = readGarage(localStorage.getItem(key)) } catch { garage = initialGarage() } }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(garage)) } catch {} }
  const card = (skin: Skin, owned: boolean, miniature = false) => {
    const element = document.createElement('button'); element.type = 'button'; element.className = `skin-card ${skin.rarity}${garage.equipped === skin.id ? ' equipped' : ''}${owned ? '' : ' locked'}`
    element.style.setProperty('--skin-color', skin.color); element.style.setProperty('--skin-paint', skin.paint)
    const art = document.createElement('div'); art.className = `skin-art frog-art ${skin.finish}`
    // Frog silhouettes are shared by inventory and case reel cards.
    for (const name of ['frog-leg left', 'frog-leg right', 'frog-arm left', 'frog-arm right', 'frog-body', 'frog-belly', 'frog-eye left', 'frog-eye right', 'frog-mouth']) { const part = document.createElement('i'); part.className = name; art.append(part) }
    const label = document.createElement('strong'); label.textContent = skin.name
    const rarity = document.createElement('small'); rarity.textContent = miniature ? rarityLabels[skin.rarity] : garage.equipped === skin.id ? '✓ УСТАНОВЛЕН' : owned ? 'УСТАНОВИТЬ' : 'В КЕЙСЕ'
    element.append(art, label, rarity); element.disabled = miniature || !owned
    element.setAttribute('aria-label', `${skin.name}, ${rarityLabels[skin.rarity]}, ${garage.equipped === skin.id ? 'установлен' : owned ? 'установить' : 'не открыт'}`)
    if (!miniature) element.addEventListener('click', () => { if (equipSkin(garage, skin.id)) { save(); onEquip(skin); render() } })
    return element
  }
  const render = () => {
    $('#garage-balance').textContent = garage.coins.toLocaleString('ru')
    $('#garage-header-balance').textContent = garage.coins.toLocaleString('ru')
    $('#garage-pilot').textContent = profile
    $('#garage-owned').textContent = `${garage.owned.length} / ${skins.length}`
    $('#garage-equipped').textContent = skins.find(s => s.id === garage.equipped)!.name
    const button = $<HTMLButtonElement>('#open-case'); button.disabled = opening || garage.coins < CASE_PRICE
    button.textContent = opening ? 'Кейс открывается…' : garage.coins < CASE_PRICE ? `Нужно ещё ${CASE_PRICE - garage.coins} ◈` : `Открыть кейс · ${CASE_PRICE} ◈`
    if (!opening) $('#garage-inventory').replaceChildren(...skins.map(skin => card(skin, garage.owned.includes(skin.id))))
  }
  load(); render()
  const refresh = () => {
    if (opening) return
    if (profile !== pilot()) {
      $('#case-result').textContent = 'Новый скин или +60 ◈ за дубликат.'
      $('#case-result').className = 'case-result'
      const strip = $('#case-strip')
      strip.getAnimations().forEach(animation => animation.cancel())
      strip.removeAttribute('aria-hidden')
      const idle = document.createElement('div'); idle.className = 'case-idle'
      for (const [tag, text] of [['span', '◈'], ['strong', 'НЕОНОВАЯ НОЧЬ'], ['small', '8 СКИНОВ · ОДИН КЕЙС · ТВОЙ СЛЕД']]) {
        const label = document.createElement(tag); label.textContent = text; idle.append(label)
      }
      strip.replaceChildren(idle)
    }
    profile = pilot(); load(); render(); onEquip(skins.find(s => s.id === garage.equipped)!)
  }
  const open = () => { refresh(); dialog.showModal() }
  $('#garage-button').addEventListener('click', open)
  $('#garage-close').addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', event => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close() } })
  $('#open-case').addEventListener('click', async () => {
    if (opening) return
    load()
    const prize = openCase(garage)
    if (!prize) { render(); return }
    // Commit before animation so closing/reloading never loses an awarded skin.
    save(); opening = true; render()
    const result = $('#case-result'); result.textContent = 'Расшифровываем содержимое…'; result.className = 'case-result'
    const strip = $('#case-strip'), viewport = $('#case-viewport'), winningIndex = 26
    strip.getAnimations().forEach(animation => animation.cancel())
    strip.setAttribute('aria-hidden', 'true')
    const reel = Array.from({ length: 33 }, () => skins[1 + Math.floor(Math.random() * (skins.length - 1))]); reel[winningIndex] = prize.skin
    strip.replaceChildren(...reel.map(skin => card(skin, true, true)))
    const width = strip.children[0].getBoundingClientRect().width, gap = 10
    const offset = viewport.clientWidth / 2 - (winningIndex * (width + gap) + width / 2)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    try {
      const animation = strip.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${offset}px)` }], { duration: reduced ? 0 : 4200, easing: 'cubic-bezier(.12,.65,.12,1)', fill: 'forwards' })
      await animation.finished
    } catch { /* Prize was already persisted if the animation was interrupted. */ }
    opening = false
    result.className = `case-result ${prize.skin.rarity}`
    result.textContent = `${prize.skin.name} · ${rarityLabels[prize.skin.rarity]}${prize.duplicate ? ` · Дубликат: +${prize.refund} ◈` : ' · Добавлен в инвентарь'}`
    render()
  })
  return {
    refresh,
    get skin() { return skins.find(s => s.id === garage.equipped)! },
    reward: (record: RaceRecord, racePilot: string) => {
      const rewardKey = garageKey(racePilot)
      let account = garage
      if (rewardKey !== key) { try { account = readGarage(localStorage.getItem(rewardKey)) } catch { account = initialGarage() } }
      else if (!opening) load()
      account = rewardKey === key ? garage : account
      rewardRace(account, record.id ?? `${record.at}:${record.result}:${record.distance}`, record.result)
      try { localStorage.setItem(rewardKey, JSON.stringify(account)) } catch {}
      if (rewardKey === key) render()
    },
  }
}
