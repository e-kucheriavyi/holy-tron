import type { State } from './types.ts'
export const drawMinimap = (canvas: HTMLCanvasElement, state: State | null) => {
  const ctx = canvas.getContext('2d')!
  canvas.width = 240; canvas.height = 240
  ctx.fillStyle = '#07151ac9'; ctx.fillRect(0, 0, 240, 240)
  ctx.strokeStyle = '#25505b'; ctx.lineWidth = 1; ctx.strokeRect(7, 7, 226, 226)
  if (!state) return
  const scale = 226 / (state.arenaSize + 1), point = (n: number) => 7 + (n + .5) * scale
  for (const p of state.players) {
    if (!p.connected) continue
    ctx.globalAlpha = p.isAlive ? .85 : .18; ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.beginPath()
    const path = [...p.trace, p.x, p.y]
    for (let i = 0; i < path.length; i += 2) { if (!i) ctx.moveTo(point(path[i]), point(path[i + 1])); else ctx.lineTo(point(path[i]), point(path[i + 1])) }
    ctx.stroke()
    if (p.isAlive) {
      ctx.fillStyle = p.id === state.playerId ? '#fff' : p.color; ctx.beginPath(); ctx.arc(point(p.x), point(p.y), p.id === state.playerId ? 4 : 2.5, 0, Math.PI * 2); ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}
