import { Direction } from './types.ts'

const keymap: Record<string, Direction> = {
  ArrowLeft: Direction.LEFT, ArrowRight: Direction.RIGHT, ArrowUp: Direction.UP, ArrowDown: Direction.DOWN,
  KeyA: Direction.LEFT, KeyD: Direction.RIGHT, KeyW: Direction.UP, KeyS: Direction.DOWN,
}

export const handleInputs = (connection: { send: (direction: Direction) => void }) => {
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('dialog[open]')) return
    const direction = keymap[event.code] ?? keymap[event.key]
    if (!direction) return
    event.preventDefault()
    if (!event.repeat) connection.send(direction)
  }
  const onTouch = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-direction]')
    if (button) { event.preventDefault(); connection.send(button.dataset.direction as Direction) }
  }
  window.addEventListener('keydown', onKey)
  document.querySelector('.touch-controls')?.addEventListener('pointerdown', onTouch)
  return () => {
    window.removeEventListener('keydown', onKey)
    document.querySelector('.touch-controls')?.removeEventListener('pointerdown', onTouch)
  }
}
