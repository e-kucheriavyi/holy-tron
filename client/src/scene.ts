import * as T from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createFrog, type FrogModel } from './frog.ts'
import { playerColor } from './colors.ts'
import { buildScenery } from './scenery.ts'
import { skins, type Skin } from './garage.ts'
import { Direction, Phase, type Player, type State } from './types.ts'

export type CameraMode = 'chase' | 'cockpit' | 'overview'
export interface Arena3D { update: (state: State | null) => void; setActive: (active: boolean) => void; setCamera: (mode: CameraMode) => void; setSkin: (skin: Skin) => void; dispose: () => void }
type Trail = { body: T.Mesh; top: T.Mesh; base: T.Mesh }
type Rider = { root: T.Group; pivot: T.Group; frog: FrogModel; trails: Trail[]; position: T.Vector3; from: T.Vector3; target: T.Vector3; color: T.Color; angle: number; targetAngle: number; bank: number; alive: boolean }
const box = new T.BoxGeometry(1, 1, 1)
const heading = { r: 0, d: -Math.PI / 2, l: Math.PI, u: Math.PI / 2 }
const neon = (color: T.Color | string, intensity = 1) => new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(intensity), toneMapped: false })
const meshBox = (parent: T.Object3D, dimensions: number[], position: number[], material: T.Material) => {
  const mesh = new T.Mesh(box, material); mesh.scale.fromArray(dimensions); mesh.position.fromArray(position); parent.add(mesh); return mesh
}
const disposeGroup = (group: T.Object3D) => {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>()
  group.traverse(o => { if (o instanceof T.Mesh || o instanceof T.LineSegments || o instanceof T.Points) {
    if (o instanceof T.InstancedMesh) o.dispose()
    if (o.geometry !== box) geometries.add(o.geometry)
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m)
  } })
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
  group.removeFromParent()
}

export const createArena3D = (canvas: HTMLCanvasElement): Arena3D => {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setClearColor('#020205')
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap
  const scene = new T.Scene(); scene.fog = new T.FogExp2('#020205', .0012)
  const camera = new T.PerspectiveCamera(67, 1, .15, 1100)
  const pmrem = new T.PMREMGenerator(renderer), room = new RoomEnvironment()
  const environment = pmrem.fromScene(room, .04); scene.environment = environment.texture
  room.dispose(); pmrem.dispose(); scene.environmentIntensity = .65
  scene.add(new T.HemisphereLight('#ffffff', '#2b0528', 2))
  const sun = new T.DirectionalLight('#ffffff', 3); sun.position.set(-35, 70, 20)
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, far: 220 }); sun.shadow.bias = -.0004
  scene.add(sun)
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new T.Vector2(1, 1), .35, .35, 1.2)
  composer.addPass(bloom); composer.addPass(new OutputPass())
  const arena = new T.Group(); scene.add(arena)
  const riders = new Map<number, Rider>()
  const sparks: { points: T.Points; velocities: Float32Array; age: number }[] = []
  let scenery: ReturnType<typeof buildScenery> | undefined
  let reflector: Reflector | undefined, state: State | null = null, active = false, frame = 0
  let arenaSize = 50, worldSize = 153, mode: CameraMode = 'chase', cameraReady = false
  let lastTime = performance.now(), receivedAt = performance.now(), tickMs = 180
  let selectedSkin = skins[0]
  let yaw = .7, pitch = .8, dragging = false, px = 0, py = 0
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const lookAt = new T.Vector3(), desiredCamera = new T.Vector3(), desiredLook = new T.Vector3()
  const point = (x: number, y: number) => new T.Vector3((x + .5) * 3 - worldSize / 2, 0, (y + .5) * 3 - worldSize / 2)

  const buildArena = () => {
    scenery?.dispose(); reflector?.dispose(); disposeGroup(arena); arena.clear(); scene.add(arena)
    worldSize = (arenaSize + 1) * 3
    const half = worldSize / 2
    const floorMat = new T.MeshStandardMaterial({ color: '#0c1c2c', metalness: .8, roughness: .28 })
    const base = meshBox(arena, [worldSize + 4, 3, worldSize + 4], [0, -1.65, 0], floorMat); base.receiveShadow = true
    reflector = new Reflector(new T.PlaneGeometry(worldSize, worldSize), { color: 0x150a14, textureWidth: innerWidth < 600 ? 512 : 1024, textureHeight: 512, multisample: 0, clipBias: .003 })
    reflector.rotation.x = -Math.PI / 2; reflector.position.y = -.12; arena.add(reflector)
    const grid = new T.GridHelper(worldSize, arenaSize + 1, '#35213a', '#261423'); grid.position.y = -.07; arena.add(grid)
    const major = new T.GridHelper(worldSize, Math.max(1, Math.round((arenaSize + 1) / 5)), '#3b1f37', '#3b1f37'); major.position.y = -.06; arena.add(major)
    const reflect = reflector.onBeforeRender.bind(reflector)
    reflector.onBeforeRender = (...args) => {
      grid.visible = false; major.visible = false
      reflect(...args)
      grid.visible = true; major.visible = true
    }
    const barrier = new T.MeshBasicMaterial({ color: '#09090f' })
    const light = neon('#d5ff00', 1.15), gold = neon('#ff20cf', 1.25)
    for (const sign of [-1, 1]) {
      meshBox(arena, [worldSize + 3, .7, 1.5], [0, .2, sign * (half + .8)], barrier)
      meshBox(arena, [1.5, .7, worldSize + 3], [sign * (half + .8), .2, 0], barrier)
      meshBox(arena, [worldSize, .14, .2], [0, .6, sign * half], light)
      meshBox(arena, [.2, .14, worldSize], [sign * half, .6, 0], light)
      meshBox(arena, [worldSize, .07, .2], [0, .06, sign * half], gold)
      meshBox(arena, [.2, .07, worldSize], [sign * half, .06, 0], gold)
    }
    const ground = new T.Mesh(new T.PlaneGeometry(2500, 2500), new T.MeshBasicMaterial({ color: '#050c15' }))
    ground.rotation.x = -Math.PI / 2; ground.position.y = -3.2; arena.add(ground)
    const outsideGrid = new T.GridHelper(900, 90, '#102b41', '#102b41'); outsideGrid.position.y = -3.1; arena.add(outsideGrid)
    scenery = buildScenery(arena, half, reduced)
  }

  const createRider = (p: Player) => {
    const color = playerColor(p.color), root = new T.Group(), pivot = new T.Group(), frog = createFrog(color, p.id === (state?.playerId ?? -1) ? selectedSkin : undefined)
    pivot.add(frog.object); root.add(pivot); scene.add(root)
    const position = point(p.x, p.y)
    const rider: Rider = { root, pivot, frog, trails: [], color, position: position.clone(), from: position.clone(), target: position.clone(), angle: heading[p.direction], targetAngle: heading[p.direction], bank: 0, alive: p.isAlive }
    riders.set(p.id, rider); return rider
  }
  const makeTrail = (rider: Rider): Trail => {
    const bodyMat = new T.MeshBasicMaterial({ color: rider.color, transparent: true, opacity: .8, depthWrite: false, toneMapped: false })
    const glow = new T.MeshBasicMaterial({ color: rider.color, transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })
    const body = new T.Mesh(box, bodyMat), top = new T.Mesh(box, neon(rider.color, 2)), base = new T.Mesh(box, glow)
    scene.add(body, top, base); return { body, top, base }
  }
  const trailSegment = (trail: Trail, from: T.Vector3, to: T.Vector3, alive: boolean) => {
    const length = from.distanceTo(to), angle = -Math.atan2(to.z - from.z, to.x - from.x)
    for (const [mesh, height, y, thickness] of [[trail.body, .09, .065, .34], [trail.top, .025, .12, .12], [trail.base, .012, .015, 1.15]] as const) {
      mesh.visible = length > .02; mesh.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2); mesh.rotation.y = angle; mesh.scale.set(length, height, thickness)
      ;(mesh.material as T.Material).transparent = true; (mesh.material as T.Material).opacity = mesh === trail.body ? alive ? .8 : .16 : mesh === trail.base ? alive ? .16 : .035 : alive ? 1 : .2
    }
  }
  const removeRider = (rider: Rider) => {
    disposeGroup(rider.root)
    for (const trail of rider.trails) for (const mesh of Object.values(trail)) disposeGroup(mesh)
  }
  const explosion = (rider: Rider) => {
    const count = 65, positions = new Float32Array(count * 3), velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions.set([rider.position.x, .8, rider.position.z], i * 3)
      velocities.set([(Math.random() - .5) * 18, Math.random() * 15, (Math.random() - .5) * 18], i * 3)
    }
    const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.BufferAttribute(positions, 3))
    const points = new T.Points(geometry, new T.PointsMaterial({ color: rider.color, size: .2, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }))
    scene.add(points); sparks.push({ points, velocities, age: 0 })
  }
  const preview: Player[] = [
    { id: -1, nickname: '', color: '#86f8d8', x: 25, y: 32, direction: Direction.UP, trace: [8, 45, 25, 45], connected: true, isAlive: true, wins: 0, games: 0 },
    { id: -2, nickname: '', color: '#ffa971', x: 35, y: 21, direction: Direction.RIGHT, trace: [10, 12, 19, 12, 19, 21], connected: true, isAlive: true, wins: 0, games: 0 },
    { id: -3, nickname: '', color: '#a29bff', x: 11, y: 28, direction: Direction.DOWN, trace: [42, 6, 11, 6], connected: true, isAlive: true, wins: 0, games: 0 },
  ]
  const update = (next: State | null) => {
    const reset = state?.gameId !== next?.gameId || state?.arenaSize !== next?.arenaSize || (state === null) !== (next === null)
    const nextArena = next?.arenaSize ?? 50
    if (nextArena !== arenaSize) { arenaSize = nextArena; buildArena() }
    if (reset) { for (const r of riders.values()) removeRider(r); riders.clear(); cameraReady = false }
    state = next; tickMs = state?.tickInterval ?? 180; receivedAt = performance.now()
    const players = state?.players.filter(p => p.connected) ?? preview
    for (const [id, rider] of riders) if (!players.some(p => p.id === id)) { removeRider(rider); riders.delete(id) }
    for (const p of players) {
      const fresh = !riders.has(p.id), rider = riders.get(p.id) ?? createRider(p)
      if (rider.alive && !p.isAlive) explosion(rider)
      rider.alive = p.isAlive; rider.frog.object.visible = p.isAlive
      rider.from.copy(rider.position); rider.target.copy(point(p.x, p.y))
      const nextAngle = heading[p.direction]
      if (nextAngle !== rider.targetAngle) {
        const corner = point(p.trace[p.trace.length - 2], p.trace[p.trace.length - 1])
        rider.from.copy(corner); rider.position.copy(corner)
        let diff = nextAngle - rider.targetAngle; diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        rider.bank = reduced ? 0 : -Math.sign(diff) * .42
      }
      rider.targetAngle = nextAngle
      if (fresh || reset) { rider.position.copy(rider.target); rider.from.copy(rider.target) }
      const segments = p.trace.length / 2
      while (rider.trails.length < segments) rider.trails.push(makeTrail(rider))
      for (let i = 0; i < rider.trails.length; i++) {
        const trail = rider.trails[i]
        if (i >= segments) { trail.body.visible = trail.top.visible = trail.base.visible = false; continue }
        trailSegment(trail, point(p.trace[i * 2], p.trace[i * 2 + 1]), i === segments - 1 ? rider.position : point(p.trace[i * 2 + 2], p.trace[i * 2 + 3]), p.isAlive)
      }
    }
  }
  const resize = () => {
    const bounds = canvas.getBoundingClientRect(); if (!bounds.width || !bounds.height) return
    renderer.setSize(bounds.width, bounds.height, false); composer.setSize(bounds.width, bounds.height)
    camera.aspect = bounds.width / bounds.height; camera.updateProjectionMatrix()
  }
  const animate = (time: number) => {
    if (!active) return
    frame = requestAnimationFrame(animate)
    if (document.hidden) { lastTime = time; return }
    const dt = Math.min((time - lastTime) / 1000, .05); lastTime = time
    const players = state?.players.filter(p => p.connected) ?? preview
    for (const p of players) {
      const rider = riders.get(p.id)!
      const progress = Math.min(1, (time - receivedAt) / tickMs)
      rider.position.lerpVectors(rider.from, rider.target, progress)
      const diff = Math.atan2(Math.sin(rider.targetAngle - rider.angle), Math.cos(rider.targetAngle - rider.angle))
      rider.angle += diff * (1 - Math.exp(-dt * 16)); rider.bank *= Math.exp(-dt * 5)
      rider.pivot.position.copy(rider.position); rider.pivot.rotation.y = rider.angle; rider.frog.object.rotation.x = rider.bank * .6
      rider.frog.animate(time / 1000 + p.id * .71, state?.phase === Phase.GAME && p.isAlive, reduced)
      const i = p.trace.length / 2 - 1
      if (rider.trails[i]) {
        const corner = point(p.trace[i * 2], p.trace[i * 2 + 1])
        const tail = rider.position.clone().sub(corner)
        tail.setLength(Math.max(0, tail.length() - 1.9)).add(corner)
        trailSegment(rider.trails[i], corner, tail, p.isAlive)
      }
    }
    const mine = players.find(p => p.id === state?.playerId), focusPlayer = mine?.isAlive ? mine : players.find(p => p.isAlive) ?? players[0]
    const focus = focusPlayer && riders.get(focusPlayer.id)
    const racing = state !== null
    if (focus) {
      const forward = new T.Vector3(Math.cos(focus.angle), 0, -Math.sin(focus.angle))
      const side = new T.Vector3(-forward.z, 0, forward.x)
      focus.frog.object.visible = focus.alive && mode !== 'cockpit'
      if (mode === 'overview') {
        const distance = worldSize * (camera.aspect < 1 ? 1.8 : 1.25)
        desiredCamera.set(Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance); desiredLook.set(0, 0, 0)
      } else if (!racing) {
        desiredCamera.copy(focus.position).addScaledVector(forward, 5.6).addScaledVector(side, 5.5).add(new T.Vector3(0, 3.2, 0))
        desiredLook.copy(focus.position).addScaledVector(forward, .2).y = 1.1
      } else if (mode === 'cockpit') {
        desiredCamera.copy(focus.position).addScaledVector(forward, .75).add(new T.Vector3(0, 2.15, 0))
        desiredLook.copy(focus.position).addScaledVector(forward, 25).y = 1.8
      } else {
        desiredCamera.copy(focus.position).addScaledVector(forward, -6.8).addScaledVector(side, 2.4).add(new T.Vector3(0, 3.2, 0))
        desiredLook.copy(focus.position).addScaledVector(forward, 8.5).y = 1
      }
      const damping = reduced ? 1 : 1 - Math.exp(-dt * (mode === 'cockpit' ? 30 : 6))
      if (!cameraReady) { camera.position.copy(desiredCamera); lookAt.copy(desiredLook); cameraReady = true }
      else { camera.position.lerp(desiredCamera, damping); lookAt.lerp(desiredLook, damping) }
      camera.lookAt(lookAt)
      const speedFov = state?.phase === Phase.GAME ? mode === 'cockpit' ? 79 : 65 : 61
      if (Math.abs(camera.fov - speedFov) > .05) { camera.fov = T.MathUtils.lerp(camera.fov, speedFov, .04); camera.updateProjectionMatrix() }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const effect = sparks[i]; effect.age += dt
      const attribute = effect.points.geometry.getAttribute('position') as T.BufferAttribute
      for (let j = 0; j < attribute.count; j++) {
        attribute.setXYZ(j, attribute.getX(j) + effect.velocities[j * 3] * dt, attribute.getY(j) + effect.velocities[j * 3 + 1] * dt, attribute.getZ(j) + effect.velocities[j * 3 + 2] * dt)
        effect.velocities[j * 3 + 1] -= dt * 20
      }
      attribute.needsUpdate = true; (effect.points.material as T.PointsMaterial).opacity = Math.max(0, 1 - effect.age / 1.2)
      if (effect.age > 1.2) { effect.points.removeFromParent(); effect.points.geometry.dispose(); (effect.points.material as T.PointsMaterial).dispose(); sparks.splice(i, 1) }
    }
    scenery?.animate(time / 1000)
    composer.render()
  }
  const onDown = (e: PointerEvent) => { if (mode !== 'overview') return; dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId) }
  const onMove = (e: PointerEvent) => { if (!dragging) return; yaw += (e.clientX - px) * .004; pitch = T.MathUtils.clamp(pitch + (e.clientY - py) * .004, .3, 1.4); px = e.clientX; py = e.clientY }
  const onUp = () => { dragging = false }
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp)
  const observer = new ResizeObserver(resize); observer.observe(canvas)
  buildArena(); update(null)
  return {
    update,
    setSkin: skin => {
      if (selectedSkin.id === skin.id) return
      selectedSkin = skin
      const rider = riders.get(state?.playerId ?? -1)
      if (rider) {
        disposeGroup(rider.frog.object)
        rider.frog = createFrog(rider.color, selectedSkin); rider.pivot.add(rider.frog.object); rider.frog.object.visible = rider.alive
      }
    },
    setCamera: next => { mode = next; cameraReady = false; for (const rider of riders.values()) rider.frog.object.visible = rider.alive },
    setActive: next => { if (active === next) return; active = next; if (active) { resize(); lastTime = performance.now(); frame = requestAnimationFrame(animate) } else cancelAnimationFrame(frame) },
    dispose: () => {
      active = false; cancelAnimationFrame(frame); observer.disconnect()
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp)
      scenery?.dispose(); reflector?.dispose(); environment.dispose(); sun.shadow.dispose(); disposeGroup(scene); bloom.dispose(); composer.dispose(); renderer.dispose()
    },
  }
}
