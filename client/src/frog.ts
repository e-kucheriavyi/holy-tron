import * as T from 'three'
import type { Skin } from './garage.ts'

export interface FrogModel {
  object: T.Group
  animate: (seconds: number, moving: boolean, reducedMotion: boolean) => void
}

// Faces +X, matching server directions and the chase camera. No collider or game rules live here.
export const createFrog = (playerColor: T.Color, skin?: Skin): FrogModel => {
  const object = new T.Group(); object.name = 'Light frog'
  const torso = new T.Group(); object.add(torso)
  const accent = skin ? new T.Color(skin.color) : playerColor.clone()
  const color = skin?.id === 'factory' ? new T.Color('#72cf35') : skin ? new T.Color(skin.paint).lerp(accent, .78) : playerColor.clone()
  const skinMaterial = new T.MeshPhysicalMaterial({ color, roughness: skin?.finish === 'carbon' ? .6 : .4, metalness: skin?.id === 'gold' ? .55 : .04, clearcoat: .7, clearcoatRoughness: .2,
    emissive: color, emissiveIntensity: .12, iridescence: skin?.finish === 'holo' ? .9 : 0, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 450] })
  const darker = new T.MeshStandardMaterial({ color: color.clone().multiplyScalar(.45), roughness: .6 })
  const bellyMaterial = new T.MeshStandardMaterial({ color: '#e6e9a3', roughness: .65 })
  const eyeWhite = new T.MeshBasicMaterial({ color: '#fff7cb' }), iris = new T.MeshBasicMaterial({ color: '#efb83c' })
  const pupil = new T.MeshBasicMaterial({ color: '#06110c' }), glint = new T.MeshBasicMaterial({ color: '#ffffff' })
  const markings = new T.MeshBasicMaterial({ color: accent.clone().multiplyScalar(.65), toneMapped: false })
  const sphere = new T.SphereGeometry(1, 24, 18), capsule = new T.CapsuleGeometry(1, 1, 5, 12)
  const blob = (parent: T.Object3D, material: T.Material, position: number[], scale: number[]) => {
    const mesh = new T.Mesh(sphere, material); mesh.position.fromArray(position); mesh.scale.fromArray(scale); mesh.castShadow = true; parent.add(mesh); return mesh
  }
  const limb = (parent: T.Group, a: number[], b: number[], radius: number) => {
    const from = new T.Vector3().fromArray(a), to = new T.Vector3().fromArray(b), vector = to.clone().sub(from)
    const mesh = new T.Mesh(capsule, skinMaterial)
    mesh.scale.set(radius, Math.max(radius, vector.length() / 3), radius)
    mesh.position.copy(from).add(to).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vector.normalize()); mesh.castShadow = true; parent.add(mesh)
  }
  const foot = (parent: T.Group, x: number, z: number, forward: boolean, y: number) => {
    blob(parent, skinMaterial, [x, y, z], [.48, .12, .29])
    for (let i = -1; i <= 1; i++) {
      const toe = new T.Mesh(capsule, skinMaterial)
      toe.position.set(x + (forward ? .3 : -.25), y, z + i * .21)
      toe.scale.set(.075, .25, .075); toe.rotation.z = -Math.PI / 2; toe.rotation.y = i * .27; parent.add(toe)
      blob(parent, skinMaterial, [x + (forward ? .59 : -.52), y - .02, z + i * .29], [.12, .07, .12])
    }
  }
  blob(torso, skinMaterial, [-.25, .9, 0], [1.15, .75, .94])
  blob(torso, bellyMaterial, [.1, .62, 0], [1.04, .48, .8])
  blob(torso, skinMaterial, [.76, 1.24, 0], [.96, .61, .94])
  const throat = blob(torso, bellyMaterial, [1.25, .91, 0], [.44, .28, .64])
  // Dark, shallow smile follows the front of the snout instead of a motorbike visor.
  const smileCurve = new T.CatmullRomCurve3([new T.Vector3(1.46, 1.15, -.69), new T.Vector3(1.64, 1.05, 0), new T.Vector3(1.46, 1.15, .69)])
  const smile = new T.Mesh(new T.TubeGeometry(smileCurve, 20, .025, 5, false), pupil); torso.add(smile)
  for (const sign of [-1, 1]) {
    blob(torso, pupil, [1.59, 1.4, sign * .27], [.035, .025, .045])
    blob(torso, skinMaterial, [.87, 1.75, sign * .63], [.4, .49, .4])
  }
  const eyes: T.Group[] = []
  for (const sign of [-1, 1]) {
    const eye = new T.Group(); eye.position.set(1.08, 1.87, sign * .65); torso.add(eye); eyes.push(eye)
    blob(eye, eyeWhite, [0, 0, 0], [.32, .36, .29])
    blob(eye, iris, [.265, .015, 0], [.09, .23, .21])
    blob(eye, pupil, [.337, .015, 0], [.035, .17, .105])
    blob(eye, glint, [.369, .095, -.045], [.014, .055, .04])
  }
  const hindLegs: T.Group[] = [], frontLegs: T.Group[] = []
  for (const sign of [-1, 1]) {
    const hind = new T.Group(); hind.position.set(-.75, .45, sign * .83); object.add(hind); hindLegs.push(hind)
    blob(hind, skinMaterial, [-.2, .13, sign * .28], [.72, .44, .46])
    limb(hind, [-.5, .08, sign * .37], [.18, -.25, sign * .61], .2)
    foot(hind, -.35, sign * .7, false, -.35)
    const front = new T.Group(); front.position.set(.67, .65, sign * .73); object.add(front); frontLegs.push(front)
    limb(front, [0, 0, 0], [-.06, -.4, sign * .4], .16)
    limb(front, [-.06, -.4, sign * .4], [.43, -.5, sign * .4], .12)
    foot(front, .36, sign * .38, true, -.55)
  }
  // Back spots keep the model recognisably amphibian from the chase camera.
  for (const [x, z, r] of [[-.65, -.35, .16], [-.45, .35, .13], [.03, -.3, .1], [-.91, .12, .11], [-.02, .28, .12]]) {
    const spot = blob(torso, darker, [x, 1.53, z], [r, .035, r * .8]); spot.rotation.z = -.15
  }
  for (const sign of [-1, 1]) blob(torso, markings, [-.4, 1, sign * .9], [.42, .07, .035])
  const glow = new T.PointLight(accent, 1.3, 5, 1.5); glow.position.set(-.8, .4, 0); object.add(glow)

  return {
    object,
    animate: (seconds, moving, reducedMotion) => {
      const phase = seconds * 10, hop = moving && !reducedMotion ? Math.max(0, Math.sin(phase)) : 0
      object.position.y = hop * .28; object.rotation.z = moving && !reducedMotion ? Math.cos(phase) * .045 : 0
      torso.scale.y = moving && !reducedMotion ? 1 - Math.max(0, -Math.sin(phase)) * .07 : 1
      throat.scale.y = .28 * (reducedMotion ? 1 : 1 + Math.sin(seconds * 2.5) * .06)
      const blink = !reducedMotion && seconds % 6.1 > 5.93 ? .12 : 1
      for (const eye of eyes) eye.scale.y = blink
      for (let i = 0; i < 2; i++) {
        const sign = i ? 1 : -1
        hindLegs[i].rotation.y = moving && !reducedMotion ? sign * Math.sin(phase) * .22 : 0
        hindLegs[i].rotation.z = moving && !reducedMotion ? Math.cos(phase) * .1 : 0
        frontLegs[i].rotation.z = moving && !reducedMotion ? -Math.sin(phase) * .15 : 0
      }
    },
  }
}
