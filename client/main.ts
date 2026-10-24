import './style.css'
import { draw, resize, handleInputs, createStore, createConnection, Phase, type State, type Direction } from './src/index.ts'
import { createPracticeConnection } from './src/practice.ts'
import type { Arena3D } from './src/scene.ts'
import type { Connection, ConnectionStatus } from './src/network.ts'

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!
const nickname = $<HTMLInputElement>('#nickname'), endpoint = $<HTMLInputElement>('#endpoint')
const overlay = $('#arena-overlay'), countdown = $('#countdown')
const startButton = $<HTMLButtonElement>('#start-button'), joinButton = $<HTMLButtonElement>('#join-button')
const help = $<HTMLDialogElement>('#help-dialog')
let scene3D: Arena3D | undefined
const renderArena = (next: State | null) => { if (!$('#canvas').hidden) draw(next); scene3D?.update(next) }
let mode: 'practice' | 'online' = 'practice'
let connection: Connection | undefined, state: State | null = null
let connected = false, round = 0, wins = 0, roundStarted = 0, elapsed = 0, version = 0
let sound = false, audio: AudioContext | undefined
let toastTimer: ReturnType<typeof setTimeout>, previousPhase: string | undefined, wasAlive = true, lastPlayers = ''
try {
  nickname.value = localStorage.getItem('tron-nickname') || 'Pilot_01'
  endpoint.value = localStorage.getItem('tron-endpoint') || endpoint.value
} catch { /* Storage may be unavailable in a private browsing context. */ }
const notify = (message: string) => {
  clearTimeout(toastTimer)
  const toast = $('#toast'); toast.textContent = message; toast.hidden = false
  toastTimer = setTimeout(() => { toast.hidden = true }, 5000)
}
const beep = (frequency = 420, duration = .07) => {
  if (!sound || !audio) return
  const oscillator = audio.createOscillator(), gain = audio.createGain()
  oscillator.type = 'sine'; oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration)
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration)
}
const setStatus = (message: string, color = '#86f8d8') => { $('#arena-status').textContent = message; $('#arena-dot').style.background = color }
const setOverlay = (kicker: string, title: string, description: string, button: string, note: string) => {
  overlay.hidden = false
  $('#overlay-kicker').textContent = kicker; $('#overlay-title').textContent = title
  if (title === 'Право на поворот.') {
    const accent = document.createElement('span'); accent.textContent = 'поворот.'
    $('#overlay-title').replaceChildren(document.createTextNode('Право на '), accent)
  }
  $('#overlay-description').textContent = description; startButton.textContent = `${button} ↗`; $('#overlay-note').textContent = note
}
const setBusy = (busy: boolean) => {
  startButton.disabled = busy
  joinButton.textContent = busy ? 'Отменить подключение ×' : connected && mode === 'online' ? 'Выйти из арены ×' : mode === 'practice' ? 'Начать тренировку →' : 'Подключиться →'
}
const stop = () => {
  version++; connection?.close(); connection = undefined; connected = false; state = null; previousPhase = undefined
  roundStarted = 0; elapsed = 0; countdown.hidden = true; setBusy(false)
}
const updateStats = () => {
  const players = state?.players.filter(p => p.connected) ?? []
  const signature = JSON.stringify(players.map(p => [p.id, p.nickname, p.color, p.wins, p.isAlive]))
  if (signature !== lastPlayers) {
    lastPlayers = signature
    const list = $('#players-list'); list.replaceChildren()
    if (!players.length) {
      const empty = document.createElement('div'); empty.className = 'empty-players'; empty.textContent = 'Арена ждёт своих пилотов. Первый шаг за тобой.'; list.append(empty)
    }
    for (const player of [...players].sort((a, b) => b.wins - a.wins || a.id - b.id)) {
      const row = document.createElement('div'); row.className = `player-row${player.isAlive ? '' : ' dead'}`
      const swatch = document.createElement('span'); swatch.className = 'player-swatch'; swatch.style.setProperty('--player-color', player.color)
      const name = document.createElement('span'); name.className = 'player-name'; name.textContent = player.nickname
      const score = document.createElement('span'); score.className = 'player-score'; score.textContent = String(player.wins)
      row.append(swatch, name)
      if (player.id === state?.playerId) { const badge = document.createElement('span'); badge.className = 'you-badge'; badge.textContent = 'ТЫ'; row.append(badge) }
      row.append(score); list.append(row)
    }
  }
  $('#player-count').textContent = String(players.length).padStart(2, '0')
  $('#round-number').textContent = state ? String(mode === 'practice' ? state.gameId : state.gameId + 1).padStart(2, '0') : '—'
  $('#alive-count').textContent = state ? `${players.filter(p => p.isAlive).length} / ${players.length}` : '—'
  $('#grid-size').textContent = state ? `${state.arenaSize + 1} × ${state.arenaSize + 1}` : '51 × 51'
  const seconds = Math.floor(elapsed / 1000)
  $('#round-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
const idle = () => {
  stop(); setStatus('ГОТОВА К ЗАПУСКУ')
  setOverlay(mode === 'practice' ? 'WELCOME TO THE GRID' : 'MULTIPLAYER PROTOCOL', mode === 'practice' ? 'Право на поворот.' : 'Арена для легенд.',
    mode === 'practice' ? 'Не врезайся в стены и световые следы. Переживи всех. Забери арену.' : 'Введи позывной и подключись к серверу. Для старта нужны хотя бы два пилота.',
    mode === 'practice' ? 'Войти на арену' : 'Подключиться', mode === 'practice' ? 'ТРЕНИРОВКА С 3 БОТАМИ · БЕЗ РЕГИСТРАЦИИ' : 'РЕАЛЬНЫЕ ПИЛОТЫ · ОБЩАЯ АРЕНА')
  renderArena(null); updateStats()
}
const render = () => {
  if (!state) return
  const me = state.players.find(p => p.id === state!.playerId)
  if (state.phase !== previousPhase) {
    if (state.phase === Phase.GAME) { roundStarted = performance.now(); beep(680, .14) }
    if (state.phase === Phase.READY || state.phase === Phase.PENDING) { elapsed = 0; roundStarted = 0 }
    if (state.phase === Phase.WINNER || state.phase === Phase.END) {
      if (roundStarted) elapsed = performance.now() - roundStarted
      roundStarted = 0
      if (mode === 'practice') wins = me?.wins ?? wins
      beep(state.winnerId === state.playerId ? 880 : 180, .25)
    }
    previousPhase = state.phase
  }
  if (state.phase === Phase.GAME && roundStarted) elapsed = performance.now() - roundStarted
  if (wasAlive && me && !me.isAlive) { notify(mode === 'practice' ? 'Твой цикл разбит. Наблюдай за финалом или начни новую тренировку.' : 'Твой цикл разбит. Наблюдай за финалом — следующий раунд начнётся автоматически.'); beep(130, .2) }
  wasAlive = me?.isAlive ?? true
  overlay.hidden = true; countdown.hidden = state.phase !== Phase.READY
  if (state.phase === Phase.READY) {
    countdown.textContent = String(Math.max(1, Math.ceil(state.phaseInterval / 1000))); setStatus('ПРИГОТОВЬСЯ')
  } else if (state.phase === Phase.PENDING) {
    setStatus('ОЖИДАНИЕ ПИЛОТОВ', '#ffa971')
    setOverlay('CONNECTION ESTABLISHED', 'Ты на арене.', state.players.filter(p => p.connected).length < 2 ? 'Ждём второго пилота. Раунд начнётся автоматически — держи руки на клавишах.' : 'Пилоты подключены. Сервер готовит новый раунд — держи руки на клавишах.', 'Выйти из арены', 'ОТПРАВЬ АДРЕС КЛИЕНТА ДРУГУ И ВЫБЕРИ ТОТ ЖЕ СЕРВЕР')
  } else if (state.phase === Phase.GAME) {
    setStatus(me?.isAlive ? 'РАУНД ИДЁТ' : 'РЕЖИМ НАБЛЮДЕНИЯ', me?.isAlive ? '#86f8d8' : '#ffa971')
  } else if (state.phase === Phase.WINNER || state.phase === Phase.END) {
    const winner = state.players.find(p => p.id === state!.winnerId)
    setStatus('РАУНД ЗАВЕРШЁН', '#ffa971')
    setOverlay(winner?.id === state.playerId ? 'VICTORY / GRID SECURED' : 'ROUND COMPLETE',
      winner ? winner.id === state.playerId ? 'Арена твоя.' : `${winner.nickname} побеждает.` : 'Ничья. Яркий финал.',
      mode === 'practice' ? 'Каждый поворот — новый шанс. Возвращайся на сетку и забери следующий раунд.' : `Следующий раунд запустит сервер. ${Math.ceil(state.phaseInterval / 1000)} сек.`,
      mode === 'practice' ? 'Ещё один раунд' : 'Выйти из арены', mode === 'practice' ? `ПОБЕД В ЭТОЙ СЕССИИ: ${wins}` : 'ОСТАВАЙСЯ НА СВЯЗИ · СЛЕДУЮЩИЙ РАУНД АВТОМАТИЧЕСКИ')
  }
  renderArena(state); updateStats()
}
const onStatus = (status: ConnectionStatus) => {
  if (status === 'connecting' || status === 'waiting') {
    setStatus(status === 'connecting' ? 'ПОДКЛЮЧЕНИЕ' : 'ОЖИДАНИЕ ВХОДА', '#ffa971')
    setOverlay('CONNECTING TO THE GRID', status === 'connecting' ? 'Устанавливаем связь.' : 'Ждём свободный вход.',
      status === 'connecting' ? 'Подключаемся к WebSocket-серверу.' : 'Если раунд уже идёт, сервер впустит тебя между раундами. Ждём до 45 секунд.', 'Подключение…', 'ПОДКЛЮЧЕНИЕ МОЖНО ОТМЕНИТЬ В ПАНЕЛИ ПИЛОТА')
    setBusy(true)
  } else if (status === 'connected') { connected = true; setBusy(false) }
  else {
    stop(); renderArena(null); updateStats(); setStatus('СВЯЗЬ ПРЕРВАНА', '#ffa971')
    setOverlay('CONNECTION LOST', 'Сигнал потерян.', 'Сервер недоступен, закрыл соединение или не ответил вовремя. Проверь адрес и попробуй снова.', 'Повторить вход', 'ТРЕНИРОВКА С БОТАМИ ДОСТУПНА БЕЗ СЕРВЕРА')
  }
}
const start = () => {
  const pilot = nickname.value.trim().replace(/[:\r\n]/g, '').slice(0, 20)
  if (!pilot) { nickname.focus(); notify('Введи позывной пилота.'); return }
  nickname.value = pilot
  if (mode === 'online') {
    try {
      const url = new URL(endpoint.value.trim())
      if (!['ws:', 'wss:'].includes(url.protocol)) throw new Error()
      if (location.protocol === 'https:' && url.protocol === 'ws:') { notify('На HTTPS-странице нужен защищённый сервер wss://'); endpoint.focus(); return }
    } catch { notify('Укажи корректный WebSocket-адрес: ws:// или wss://'); endpoint.focus(); return }
  }
  stop(); wasAlive = true
  const session = version, store = createStore(pilot)
  try { localStorage.setItem('tron-nickname', pilot); localStorage.setItem('tron-endpoint', endpoint.value.trim()) } catch {}
  try {
    connection = mode === 'practice' ? createPracticeConnection(pilot, ++round, wins) : createConnection({
      nickname: pilot, endpoint: endpoint.value.trim(), mode: 'full', onStatus: status => { if (session === version) onStatus(status) },
    })
    if (mode === 'practice') { connected = true; setBusy(false); joinButton.textContent = 'Новая тренировка ↻' }
    connection.onMessage(message => {
      if (session !== version) return
      store.handle(message); state = store.state; render()
    })
  } catch { onStatus('error') }
}
$('#pilot-form').addEventListener('submit', event => { event.preventDefault(); if (mode === 'online' && connection) idle(); else start() })
startButton.addEventListener('click', () => { if (mode === 'online' && connected) idle(); else start() })
const setMode = (next: typeof mode) => {
  if (next === mode) return
  mode = next
  $('#practice-tab').classList.toggle('active', mode === 'practice'); $('#online-tab').classList.toggle('active', mode === 'online')
  $('#practice-tab').setAttribute('aria-pressed', String(mode === 'practice')); $('#online-tab').setAttribute('aria-pressed', String(mode === 'online'))
  $('#server-field').hidden = mode !== 'online'; $('#room-chip').textContent = mode === 'practice' ? 'TRAINING' : 'MULTIPLAYER'
  $('#mode-description').textContent = mode === 'practice' ? 'Ты + 3 бота. Полигон для твоих рефлексов.' : 'Нужны минимум два пилота на одном сервере.'
  idle()
}
$('#practice-tab').addEventListener('click', () => setMode('practice')); $('#online-tab').addEventListener('click', () => setMode('online'))
handleInputs({ send: (direction: Direction) => {
  if (!state || state.phase !== Phase.GAME || !state.players.find(p => p.id === state!.playerId)?.isAlive) return
  connection?.send(direction); beep(310, .025)
} })
$('#sound-button').addEventListener('click', async () => {
  try {
    audio ??= new AudioContext(); await audio.resume(); sound = !sound
    $('#sound-button').setAttribute('aria-pressed', String(sound)); $('#sound-button span').textContent = sound ? 'Звук вкл.' : 'Звук выкл.'; beep(600)
  } catch { notify('В этом браузере звук недоступен.') }
})
$('#help-button').addEventListener('click', () => help.showModal()); $('#close-help').addEventListener('click', () => help.close()); $('#help-play').addEventListener('click', () => help.close())
help.addEventListener('click', event => {
  if (event.target === help) { const rect = help.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) help.close() }
})
new ResizeObserver(() => { resize(); draw(state) }).observe($('#arena-surface'))
window.addEventListener('pagehide', () => connection?.close())
resize(); idle()

const changeView = (next: boolean) => {
  if (next && !scene3D) return
  $('#scene').hidden = !next; $('#canvas').hidden = next
  $('#view-2d').setAttribute('aria-pressed', String(!next)); $('#view-3d').setAttribute('aria-pressed', String(next))
  scene3D?.setActive(next)
  resize(); renderArena(state)
}
$('#view-2d').addEventListener('click', () => changeView(false))
$('#view-3d').addEventListener('click', () => changeView(true))
import('./src/scene.ts').then(({ createArena3D }) => {
  scene3D = createArena3D($<HTMLCanvasElement>('#scene'))
  scene3D.update(state)
  $<HTMLButtonElement>('#view-3d').disabled = false
  changeView(true)
}).catch(() => {
  $('#view-3d').setAttribute('title', 'WebGL недоступен в этом браузере')
  notify('3D недоступен в этом браузере. Арена работает в 2D.')
})
$('#scene').addEventListener('webglcontextlost', event => {
  event.preventDefault(); changeView(false)
  $<HTMLButtonElement>('#view-3d').disabled = true
  scene3D?.dispose(); scene3D = undefined
  notify('Графический контекст потерян. Продолжаем в 2D.')
})
