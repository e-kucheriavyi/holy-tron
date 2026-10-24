import * as T from 'three'

// Neon festival scenery is outside the playable square; the crowd is batched by body part.
export const buildScenery = (parent: T.Group, half: number, reducedMotion: boolean) => {
  const root = new T.Group(); root.name = 'Neon Riot stadium'; parent.add(root)
  const palettes = ['#d5ff00', '#ff20cf', '#00ddff', '#ff5525']
  const black = new T.MeshBasicMaterial({ color: '#08080d' })
  const glow = palettes.map(color => new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(1.25), toneMapped: false }))
  const box = new T.BoxGeometry(1, 1, 1), sphere = new T.SphereGeometry(1, 20, 14), cylinder = new T.CylinderGeometry(1, 1, 1, 20)
  const textures: T.Texture[] = []
  const add = (group: T.Object3D, geometry: T.BufferGeometry, material: T.Material, position: number[], scale: number[]) => {
    const mesh = new T.Mesh(geometry, material); mesh.position.fromArray(position); mesh.scale.fromArray(scale); group.add(mesh); return mesh
  }

  // Big playful mascots: vivid bodies, black visor, baseball-cap silhouette and twin rounded bases.
  for (let i = 0; i < 4; i++) {
    const mascot = new T.Group()
    const positions = [[-half * .38, -half - 18], [half + 18, -half * .38], [half * .38, half + 18], [-half - 18, half * .38]]
    const [x, z] = positions[i]
    mascot.position.set(x, 0, z); mascot.rotation.y = Math.atan2(-x, -z); mascot.scale.set(1.2, 1.35, 1.2)
    const mascotColor = i === 0 ? '#58ff00' : palettes[i]
    const paint = new T.MeshToonMaterial({ color: mascotColor, emissive: mascotColor, emissiveIntensity: .12, toneMapped: false })
    add(mascot, cylinder, black, [0, .4, 0], [11, .8, 10])
    for (const sign of [-1, 1]) add(mascot, sphere, paint, [sign * 3.4, 3.8, 0], [4.5, 4, 4.8])
    add(mascot, cylinder, paint, [0, 16, 0], [4.1, 25, 4.1])
    add(mascot, sphere, paint, [0, 29, 0], [5.1, 5.4, 4.8])
    add(mascot, sphere, black, [0, 29.5, 1.1], [5.15, .85, 4.5])
    add(mascot, sphere, paint, [0, 32, .2], [5.7, 2.9, 5.5])
    add(mascot, cylinder, glow[i], [0, 30.3, 2.4], [6.2, .45, 5.6])
    const arm = add(mascot, cylinder, paint, [6, 17, .3], [1.25, 9, 1.25]); arm.rotation.z = -.9
    add(mascot, sphere, glow[(i + 2) % 4], [9.5, 19.8, .3], [1.5, 1.5, 1.5])
    root.add(mascot)
  }

  // Pop-art speaker stacks and gates, with strong silhouettes rather than a grey skyline.
  for (let side = 0; side < 4; side++) {
    const stage = new T.Group(); stage.rotation.y = side * Math.PI / 2; stage.position.set(Math.sin(side * Math.PI / 2) * (half + 20), 0, Math.cos(side * Math.PI / 2) * (half + 20))
    for (let i = 0; i < 4; i++) {
      const block = add(stage, box, glow[(side + i) % 4], [(i % 2 ? 1 : -1) * (13 + side * 2), 4 + i * 6, -7], [5.5, 5.5, 5.5])
      block.rotation.y = .15 + i * .18; block.rotation.z = i % 2 ? .13 : -.1
    }
    const gate = new T.Mesh(new T.TorusGeometry(18, .16, 6, 70, Math.PI * 1.6), glow[side]); gate.position.set(0, 15, -12); stage.add(gate)
    root.add(stage)
  }

  const perSide = 32, rows = 2, count = perSide * rows * 4
  const material = new T.MeshBasicMaterial({ color: '#fff', toneMapped: false })
  const batch = (geometry: T.BufferGeometry, instances = count) => { const mesh = new T.InstancedMesh(geometry, material, instances); mesh.frustumCulled = false; root.add(mesh); return mesh }
  const torsos = batch(box), legs = batch(box, count * 2), heads = batch(sphere), hair = batch(sphere)
  const stripes = batch(box, count * 2), eyes = batch(box, count * 2), hats = batch(cylinder)
  const arms = batch(cylinder, count * 2), hands = batch(sphere, count * 2)
  arms.instanceMatrix.setUsage(T.DynamicDrawUsage); hands.instanceMatrix.setUsage(T.DynamicDrawUsage)
  const people: { x: number; z: number; yaw: number; phase: number; height: number }[] = []
  const matrix = new T.Matrix4(), position = new T.Vector3(), scale = new T.Vector3(), rotation = new T.Quaternion(), euler = new T.Euler()
  const skinColors = ['#ffc68f', '#dc926c', '#ae694e', '#f0b18c', '#8d5746']
  const setPart = (mesh: T.InstancedMesh, index: number, person: typeof people[number], local: number[], dimensions: number[], color?: string) => {
    const c = Math.cos(person.yaw), s = Math.sin(person.yaw)
    position.set(person.x + local[0] * c + local[2] * s, local[1], person.z - local[0] * s + local[2] * c)
    scale.fromArray(dimensions); rotation.setFromEuler(euler.set(0, person.yaw, 0)); matrix.compose(position, rotation, scale); mesh.setMatrixAt(index, matrix)
    if (color) mesh.setColorAt(index, new T.Color(color))
  }
  for (let i = 0; i < count; i++) {
    const side = Math.floor(i / (perSide * rows)), row = Math.floor(i / perSide) % rows, along = (i % perSide / (perSide - 1) * 2 - 1) * (half - 2)
    const edge = half + 4.5 + row * 4.2
    const person = { x: side % 2 ? (side === 1 ? edge : -edge) : along, z: side % 2 ? along : side === 0 ? edge : -edge, yaw: side === 0 ? Math.PI : side === 1 ? -Math.PI / 2 : side === 2 ? 0 : Math.PI / 2, phase: i * 1.73, height: 1 + i % 5 * .035 }
    people.push(person)
    const h = person.height, skin = skinColors[i % skinColors.length], accent = palettes[i % 4]
    setPart(torsos, i, person, [0, 2.25 * h, 0], [1.05, 1.65 * h, .65], i % 4 ? '#111421' : '#981a4b')
    setPart(heads, i, person, [0, 3.6 * h, 0], [.5, .58, .48], skin)
    setPart(hair, i, person, [0, 3.96 * h, -.03], [.54, .29, .51], i % 3 ? '#20121e' : accent)
    setPart(hats, i, person, [0, 4.03 * h, .18], [.68, .12, .64], i % 3 ? '#ff2859' : accent)
    for (let j = 0; j < 2; j++) {
      const sign = j ? 1 : -1, index = i * 2 + j
      setPart(legs, index, person, [sign * .29, .8 * h, 0], [.4, 1.5 * h, .45], i % 4 ? '#101624' : '#c91e2d')
      setPart(stripes, index, person, [sign * .19, 2.25 * h, .345], [.12, .92 * h, .025], accent)
      setPart(eyes, index, person, [sign * .18, 3.65 * h, .455], [.12, .1, .045], '#170c16')
      arms.setColorAt(index, new T.Color(i % 4 ? '#29233b' : '#c92350')); hands.setColorAt(index, new T.Color(skin))
    }
  }
  for (const mesh of [torsos, legs, heads, hair, stripes, eyes, hats]) mesh.instanceMatrix.needsUpdate = true
  const up = new T.Vector3(0, 1, 0), from = new T.Vector3(), to = new T.Vector3(), vector = new T.Vector3()
  const animateCrowd = (seconds: number) => {
    for (let i = 0; i < count; i++) {
      const p = people[i], c = Math.cos(p.yaw), s = Math.sin(p.yaw), wave = Math.sin(seconds * 2.1 + p.phase)
      for (let j = 0; j < 2; j++) {
        const sign = j ? 1 : -1, index = i * 2 + j
        const lx = sign * (1 + wave * .18), ly = (4.35 + Math.sin(seconds * 2.5 + p.phase + j) * .25) * p.height
        from.set(p.x + sign * .6 * c, 2.85 * p.height, p.z - sign * .6 * s)
        to.set(p.x + lx * c + .12 * s, ly, p.z - lx * s + .12 * c)
        vector.copy(to).sub(from); const length = vector.length(); rotation.setFromUnitVectors(up, vector.normalize()); position.copy(from).add(to).multiplyScalar(.5)
        scale.set(.18, length, .18); matrix.compose(position, rotation, scale); arms.setMatrixAt(index, matrix)
        rotation.identity(); scale.set(.25, .27, .25); matrix.compose(to, rotation, scale); hands.setMatrixAt(index, matrix)
      }
    }
    arms.instanceMatrix.needsUpdate = true; hands.instanceMatrix.needsUpdate = true
  }
  animateCrowd(0)

  // Coloured light pools give the floor the saturated reflections of the reference.
  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')!, gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, palettes[i]); gradient.addColorStop(.25, `${palettes[i]}a0`); gradient.addColorStop(1, `${palettes[i]}00`)
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128)
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; textures.push(texture)
    const pool = new T.Mesh(new T.PlaneGeometry(half * 1.15, half * 1.15), new T.MeshBasicMaterial({ map: texture, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }))
    pool.rotation.x = -Math.PI / 2; pool.position.set((i % 2 ? 1 : -1) * half * .57, -.025, (i < 2 ? -1 : 1) * half * .57); root.add(pool)
  }
  const confetti = new Float32Array(180 * 3), colors = new Float32Array(180 * 3)
  for (let i = 0; i < 180; i++) {
    const a = i * 2.399963, radius = half + 3 + i % 15
    confetti.set([Math.sin(a) * radius, 7 + i * 19 % 30, Math.cos(a) * radius], i * 3)
    new T.Color(palettes[i % 4]).toArray(colors, i * 3)
  }
  const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.BufferAttribute(confetti, 3)); geometry.setAttribute('color', new T.BufferAttribute(colors, 3))
  const particles = new T.Points(geometry, new T.PointsMaterial({ size: .45, vertexColors: true, transparent: true, opacity: .85, depthWrite: false, toneMapped: false })); root.add(particles)
  let lastCrowdFrame = -1
  return {
    animate: (seconds: number) => {
      if (reducedMotion || seconds - lastCrowdFrame < 1 / 24) return
      lastCrowdFrame = seconds; animateCrowd(seconds)
    },
    dispose: () => textures.forEach(texture => texture.dispose()),
  }
}
