import { Direction, type Player, type State } from './types.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!
const ctx = canvas.getContext('2d')!
let width = 1, height = 1

export const resize = () => {
  const bounds = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = bounds.width; height = bounds.height
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

const grid = (size: number, offsetX: number, offsetY: number, cell: number) => {
  ctx.lineWidth = .5
  ctx.strokeStyle = '#203039'
  ctx.beginPath()
  for (let n = 0; n <= size + 1; n++) {
    const position = n * cell
    ctx.moveTo(offsetX + position, offsetY); ctx.lineTo(offsetX + position, offsetY + (size + 1) * cell)
    ctx.moveTo(offsetX, offsetY + position); ctx.lineTo(offsetX + (size + 1) * cell, offsetY + position)
  }
  ctx.stroke()
}

const trail = (points: number[], color: string, lineWidth: number, alpha = 1) => {
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'square'
  ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = lineWidth * 4
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  for (let i = 0; i < points.length; i += 2) {
    if (i === 0) ctx.moveTo(points[i], points[i + 1]); else ctx.lineTo(points[i], points[i + 1])
  }
  ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = '#e8fff4'; ctx.globalAlpha *= .65
  ctx.lineWidth = Math.max(.5, lineWidth * .22); ctx.stroke(); ctx.restore()
}

const drawPlayer = (player: Player, cell: number, ox: number, oy: number, isMe: boolean) => {
  const points = [...player.trace, player.x, player.y].map((n, i) => (i % 2 ? oy : ox) + (n + .5) * cell)
  trail(points, player.color, Math.max(1.5, cell * .37), player.isAlive ? .9 : .19)
  if (!player.isAlive) return
  const x = ox + (player.x + .5) * cell, y = oy + (player.y + .5) * cell
  ctx.save(); ctx.translate(x, y)
  ctx.rotate({ [Direction.RIGHT]: 0, [Direction.DOWN]: Math.PI / 2, [Direction.LEFT]: Math.PI, [Direction.UP]: -Math.PI / 2 }[player.direction])
  ctx.fillStyle = '#ecfff7'; ctx.shadowColor = player.color; ctx.shadowBlur = 14
  const s = Math.max(3, cell * .48)
  ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s, -s * .62); ctx.lineTo(-s * .6, 0); ctx.lineTo(-s, s * .62); ctx.closePath(); ctx.fill()
  ctx.restore()
  if (isMe) {
    ctx.fillStyle = '#86f8d8'; ctx.font = '8px "Space Grotesk", monospace'; ctx.textAlign = 'center'
    ctx.fillText('YOU', x, y - Math.max(13, cell * 1.5))
  }
}

export const draw = (state: State | null) => {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#080f14'; ctx.fillRect(0, 0, width, height)
  if (!state) {
    const cell = Math.max(15, width / 38)
    grid(Math.ceil(width / cell), 0, 0, cell)
    const w = width, h = height
    trail([.04*w,.27*h,.23*w,.27*h,.23*w,.14*h,.44*w,.14*h,.44*w,.22*h], '#86f8d8', 2.4, .85)
    trail([.97*w,.7*h,.78*w,.7*h,.78*w,.88*h,.59*w,.88*h,.59*w,.76*h], '#ffa971', 2.4, .85)
    trail([.05*w,.76*h,.17*w,.76*h,.17*w,.56*h,.27*w,.56*h], '#8a94f4', 2, .45)
    trail([.96*w,.21*h,.85*w,.21*h,.85*w,.42*h,.74*w,.42*h], '#6eacff', 2, .45)
    return
  }
  const cell = (Math.min(width, height) - 38) / (state.arenaSize + 1)
  const side = (state.arenaSize + 1) * cell
  const ox = (width - side) / 2, oy = (height - side) / 2
  grid(state.arenaSize, ox, oy, cell)
  ctx.strokeStyle = '#4a7e7066'; ctx.lineWidth = 1; ctx.strokeRect(ox, oy, side, side)
  for (const player of state.players) if (player.connected) drawPlayer(player, cell, ox, oy, player.id === state.playerId)
}
