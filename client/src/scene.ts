import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Direction, type Player, type State } from './types.ts'

export interface Arena3D {
  update: (state: State | null) => void
  setActive: (active: boolean) => void
  dispose: () => void
}
type Beam = { body: THREE.Mesh; core: THREE.Mesh; glow: THREE.Mesh }
type Rider = { group: THREE.Group; bike: THREE.Group; beams: Beam[]; color: THREE.Color; position: THREE.Vector3; target: THREE.Vector3; rotation: number; opacity: number }
const size = 46
const box = new THREE.BoxGeometry(1, 1, 1)
const parseColor = (value: string) => {
  const hsl = value.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/)
  return hsl ? new THREE.Color().setHSL(Number(hsl[1]) / 360, Number(hsl[2]) / 100, Number(hsl[3]) / 100, THREE.SRGBColorSpace) : new THREE.Color(value)
}
const directionRotation = { r: 0, d: -Math.PI / 2, l: Math.PI, u: Math.PI / 2 }

export const createArena3D = (canvas: HTMLCanvasElement): Arena3D => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.setClearColor('#070e13')
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2('#070e13', .005)
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 300)
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .45, .35, 1.0)
  composer.addPass(bloom); composer.addPass(new OutputPass())
  scene.add(new THREE.HemisphereLight('#a8e4ef', '#101b29', 2))
  const keyLight = new THREE.DirectionalLight('#d2ffe9', 2.5)
  keyLight.position.set(-10, 40, 15); scene.add(keyLight)
  const fillLight = new THREE.PointLight('#3a68ff', 90, 65, 1.5)
  fillLight.position.set(12, 7, -20); scene.add(fillLight)

  const platform = new THREE.Mesh(new THREE.BoxGeometry(size + 1, 1, size + 1), new THREE.MeshStandardMaterial({ color: '#101c25', metalness: .65, roughness: .4 }))
  platform.position.y = -.6; scene.add(platform)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color: '#07131b', metalness: .45, roughness: .65 }))
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.075; scene.add(floor)
  let grid = new THREE.GridHelper(size, 51, '#2c6b6b', '#16323c')
  grid.position.y = -.05; scene.add(grid)

  const edgeMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color('#70dec9').multiplyScalar(1.5) })
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#102b32', emissive: '#1c4445', emissiveIntensity: .45, transparent: true, opacity: .65, metalness: .65, roughness: .25 })
  const boundary = (x: number, z: number, width: number, depth: number) => {
    const wall = new THREE.Mesh(box, wallMaterial); wall.position.set(x, .24, z); wall.scale.set(width, .5, depth); scene.add(wall)
    const edge = new THREE.Mesh(box, edgeMaterial); edge.position.set(x, .5, z); edge.scale.set(width, .035, depth); scene.add(edge)
  }
  boundary(0, -size / 2, size, .12); boundary(0, size / 2, size, .12)
  boundary(-size / 2, 0, .12, size); boundary(size / 2, 0, .12, size)
  // Small structural pylons and their horizontal bars frame the floating grid.
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    const column = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: '#283a45', metalness: .8, roughness: .3 }))
    column.position.set(x * 23.35, .45, z * 23.35); column.scale.set(.5, 1.8, .5); scene.add(column)
    const cap = new THREE.Mesh(box, edgeMaterial); cap.position.set(x * 23.35, 1.36, z * 23.35); cap.scale.set(.54, .06, .54); scene.add(cap)
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), new THREE.MeshBasicMaterial({ color: '#070e13' }))
  ground.rotation.x = -Math.PI / 2; ground.position.y = -2; scene.add(ground)
  const underGrid = new THREE.GridHelper(160, 40, '#0d252d', '#0d2028'); underGrid.position.y = -1.99; scene.add(underGrid)
  const riders = new Map<number, Rider>()
  let state: State | null = null, active = false, frame = 0, lastTime = performance.now(), arenaSize = 50
  let yaw = .12, pitch = .77, dragging = false, pointerX = 0, pointerY = 0

  const cameraPosition = () => {
    const aspect = Math.max(.4, camera.aspect)
    const distance = aspect < 1.15 ? 79 / Math.sqrt(aspect) : 74
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance)
    camera.lookAt(0, 0, 0)
  }
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false); composer.setSize(width, height)
    camera.aspect = width / height; camera.updateProjectionMatrix(); cameraPosition()
  }
  const material = (color: THREE.Color, intensity = 1) => new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(intensity), transparent: true })
  const createBike = (color: THREE.Color) => {
    const bike = new THREE.Group()
    const dark = new THREE.MeshStandardMaterial({ color: '#172b34', metalness: .85, roughness: .27 })
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(.3), emissive: color, emissiveIntensity: .25, metalness: .75, roughness: .22 })
    const lightMaterial = material(color, 2.4)
    const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
      const mesh = new THREE.Mesh(box, mat); mesh.scale.set(w, h, d); mesh.position.set(x, y, z); bike.add(mesh); return mesh
    }
    addBox(1.25, .23, .42, 0, .35, 0, bodyMaterial)
    addBox(.66, .23, .31, -.08, .54, 0, dark)
    addBox(.8, .035, .435, -.08, .4, 0, lightMaterial)
    for (const x of [-.48, .48]) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .23, 18), dark)
      tire.rotation.x = Math.PI / 2; tire.position.set(x, .28, 0); bike.add(tire)
      for (const z of [-.125, .125]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 5, 20), lightMaterial)
        ring.position.set(x, .28, z); bike.add(ring)
      }
    }
    const torso = addBox(.23, .37, .26, -.03, .78, 0, dark); torso.rotation.z = -.65
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), bodyMaterial)
    helmet.position.set(.16, .97, 0); bike.add(helmet)
    addBox(.09, .065, .27, .27, .98, 0, lightMaterial)
    addBox(.07, .1, .34, .65, .36, 0, material(new THREE.Color('#d9fff8'), 3))
    addBox(.08, .1, .3, -.68, .38, 0, lightMaterial)
    const light = new THREE.PointLight(color, 1.5, 3, 1); light.position.set(0, .7, 0); bike.add(light)
    return bike
  }
  const makeRider = (id: number, color: string) => {
    const c = parseColor(color)
    const group = new THREE.Group(), bike = createBike(c); group.add(bike); scene.add(group)
    const rider: Rider = { group, bike, beams: [], color: c, position: new THREE.Vector3(), target: new THREE.Vector3(), rotation: 0, opacity: 1 }
    riders.set(id, rider); return rider
  }
  const makeBeam = (rider: Rider): Beam => {
    const body = new THREE.Mesh(box, material(rider.color, 1.05))
    const core = new THREE.Mesh(box, material(rider.color, 2.0))
    const glowMat = material(rider.color, .8); glowMat.opacity = .12; glowMat.depthWrite = false; glowMat.blending = THREE.AdditiveBlending
    const glow = new THREE.Mesh(box, glowMat)
    rider.group.add(body, core, glow)
    return { body, core, glow }
  }
  const point = (x: number, y: number) => new THREE.Vector3((x + .5) / (arenaSize + 1) * size - size / 2, 0, (y + .5) / (arenaSize + 1) * size - size / 2)
  const setBeam = (beam: Beam, from: THREE.Vector3, to: THREE.Vector3, opacity: number, cell: number) => {
    const dx = to.x - from.x, dz = to.z - from.z, length = Math.hypot(dx, dz)
    const angle = -Math.atan2(dz, dx)
    for (const [mesh, height, width, y, alpha] of [
      [beam.body, .58, cell * .15, .29, .55], [beam.core, .045, cell * .16, .59, 1], [beam.glow, .015, cell * .75, .015, .12],
    ] as [THREE.Mesh, number, number, number, number][]) {
      mesh.visible = length > .01; mesh.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2)
      mesh.rotation.y = angle; mesh.scale.set(length, height, width)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = opacity * alpha
    }
  }
  const clearRider = (rider: Rider) => {
    scene.remove(rider.group)
    rider.group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry !== box) object.geometry.dispose()
        const mats = Array.isArray(object.material) ? object.material : [object.material]
        for (const mat of mats) mat.dispose()
      }
    })
  }
  const preview: Player[] = [
    { id: -1, nickname: '', color: '#86f8d8', x: 18, y: 10, direction: Direction.DOWN, trace: [2, 17, 11, 17, 11, 7, 18, 7], connected: true, isAlive: true, wins: 0, games: 0 },
    { id: -2, nickname: '', color: '#ffa971', x: 31, y: 38, direction: Direction.UP, trace: [48, 37, 40, 37, 40, 44, 31, 44], connected: true, isAlive: true, wins: 0, games: 0 },
    { id: -3, nickname: '', color: '#a29bff', x: 8, y: 32, direction: Direction.RIGHT, trace: [2, 45, 6, 45, 6, 32], connected: true, isAlive: true, wins: 0, games: 0 },
    { id: -4, nickname: '', color: '#6eacff', x: 40, y: 18, direction: Direction.LEFT, trace: [47, 6, 44, 6, 44, 18], connected: true, isAlive: true, wins: 0, games: 0 },
  ]
  const update = (next: State | null) => {
    const reset = state?.gameId !== next?.gameId || state?.arenaSize !== next?.arenaSize || (state === null) !== (next === null)
    state = next; arenaSize = state?.arenaSize ?? 50
    if (reset) {
      for (const rider of riders.values()) clearRider(rider)
      riders.clear()
      scene.remove(grid); grid.geometry.dispose()
      const materials = Array.isArray(grid.material) ? grid.material : [grid.material]; materials.forEach(m => m.dispose())
      grid = new THREE.GridHelper(size, Math.min(arenaSize + 1, 160), '#2c6b6b', '#16323c'); grid.position.y = -.05; scene.add(grid)
    }
    const players = state?.players.filter(p => p.connected) ?? preview
    for (const [id, rider] of riders) if (!players.some(p => p.id === id)) { clearRider(rider); riders.delete(id) }
    for (const p of players) {
      let rider = riders.get(p.id)
      if (rider && !rider.color.equals(parseColor(p.color))) { clearRider(rider); riders.delete(p.id); rider = undefined }
      const fresh = !rider
      rider ??= makeRider(p.id, p.color)
      rider.target.copy(point(p.x, p.y)); if (fresh || reset) rider.position.copy(rider.target)
      if (!fresh && rider.rotation !== directionRotation[p.direction]) {
        rider.position.copy(point(p.trace[p.trace.length - 2], p.trace[p.trace.length - 1]))
      }
      rider.rotation = directionRotation[p.direction]; rider.bike.rotation.y = rider.rotation
      rider.bike.visible = p.isAlive; rider.bike.scale.setScalar(Math.min(2.2, size / (arenaSize + 1) * .85))
      rider.opacity = p.isAlive ? 1 : .16
      const segments = p.trace.length / 2
      while (rider.beams.length < segments) rider.beams.push(makeBeam(rider))
      for (let i = 0; i < rider.beams.length; i++) {
        const beam = rider.beams[i]
        if (i >= segments) { beam.body.visible = beam.core.visible = beam.glow.visible = false; continue }
        const from = point(p.trace[i * 2], p.trace[i * 2 + 1])
        const to = i === segments - 1 ? rider.position : point(p.trace[i * 2 + 2], p.trace[i * 2 + 3])
        setBeam(beam, from, to, rider.opacity, size / (arenaSize + 1))
      }
    }
  }
  const animate = (time: number) => {
    if (!active) return
    frame = requestAnimationFrame(animate)
    if (document.hidden) { lastTime = time; return }
    const dt = Math.min((time - lastTime) / 1000, .05); lastTime = time
    const players = state?.players.filter(p => p.connected) ?? preview
    for (const p of players) {
      const rider = riders.get(p.id)!
      rider.position.lerp(rider.target, 1 - Math.exp(-dt * 25)); rider.bike.position.copy(rider.position)
      const index = p.trace.length / 2 - 1
      if (rider.beams[index]) setBeam(rider.beams[index], point(p.trace[index * 2], p.trace[index * 2 + 1]), rider.position, rider.opacity, size / (arenaSize + 1))
    }
    composer.render()
  }
  const onDown = (event: PointerEvent) => {
    dragging = true; pointerX = event.clientX; pointerY = event.clientY; canvas.setPointerCapture(event.pointerId)
  }
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    yaw += (event.clientX - pointerX) * .004
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - pointerY) * .004, .55, 1.35)
    pointerX = event.clientX; pointerY = event.clientY; cameraPosition()
  }
  const onUp = () => { dragging = false }
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp)
  const observer = new ResizeObserver(resize); observer.observe(canvas)
  update(null); resize()
  return {
    update,
    setActive: next => {
      if (active === next) return
      active = next
      if (active) { resize(); lastTime = performance.now(); frame = requestAnimationFrame(animate) } else cancelAnimationFrame(frame)
    },
    dispose: () => {
      active = false; cancelAnimationFrame(frame); observer.disconnect()
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp)
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        if (object.geometry !== box) object.geometry.dispose()
        const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(m => m.dispose())
      } })
      bloom.dispose(); composer.dispose(); renderer.dispose()
    },
  }
}
