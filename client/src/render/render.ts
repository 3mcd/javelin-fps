import { created, destroyed, query, select, World } from "@javelin/ecs"
import { Clock } from "@javelin/hrtime-loop"
import {
  ACESFilmicToneMapping,
  AxesHelper,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Quaternion,
  Scene,
  SphereBufferGeometry,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from "three"
import { Body, getServerDetails } from "../../../common"
import { getClientData } from "../queries"
import { createSky } from "./objects/sky"
import { InterpolatedTransform } from "../components"

const AXIS_HORIZONTAL = new Vector3(1, 0, 0)
const AXIS_VERTICAL = new Vector3(0, 0, 1)
const quatZ = new Quaternion()
const quatX = new Quaternion()

const scene = new Scene()
const camera = new PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  2000000,
)

scene.add(new AxesHelper(5))

scene.background = new Color().setHSL(0.6, 0, 1)
scene.fog = new Fog(scene.background.getHex(), 1, 5000)

// Lights

const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.6)
hemiLight.color.setHSL(0.6, 1, 0.6)
hemiLight.groundColor.setHSL(0.095, 1, 0.75)
hemiLight.position.set(0, 50, 0)
scene.add(hemiLight)

const dirLight = new DirectionalLight(0xffffff, 1)
dirLight.color.setHSL(0.1, 1, 0.95)
dirLight.position.set(0, -3, 1)
dirLight.position.multiplyScalar(1000)
scene.add(dirLight)

dirLight.castShadow = true

dirLight.shadow.mapSize.width = 4096
dirLight.shadow.mapSize.height = 4096

const d = 200

dirLight.shadow.camera.left = -d
dirLight.shadow.camera.right = d
dirLight.shadow.camera.top = d
dirLight.shadow.camera.bottom = -d

dirLight.shadow.camera.far = 3500
dirLight.shadow.bias = 0.0001

// Sky

const sky = createSky()
const sun = new Vector3()

sky.scale.setScalar(450000)
scene.add(sky)

const inclination = 0.399
const azimuth = 0.25

sky.material.uniforms.turbidity.value = 5.6
sky.material.uniforms.rayleigh.value = 3
sky.material.uniforms.mieCoefficient.value = 0.005
sky.material.uniforms.mieDirectionalG.value = 0.7

const theta = Math.PI * (inclination - 0.5)
const phi = 2 * Math.PI * (azimuth - 0.5)

sun.x = Math.cos(phi)
sun.y = Math.sin(phi) * Math.sin(theta)
sun.z = Math.sin(phi) * Math.cos(theta)

sky.material.uniforms.sunPosition.value.copy(sun)

// Renderer

const renderer = new WebGLRenderer({
  antialias: true,
  canvas: document.querySelector("canvas"),
})

renderer.outputEncoding = sRGBEncoding
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 0.5

renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFSoftShadowMap

document.body.appendChild(renderer.domElement)

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

onWindowResize()

window.addEventListener("resize", onWindowResize, false)

const cameraContainer = new Object3D()

camera.lookAt(0, 1, 0)
cameraContainer.add(camera)

scene.add(cameraContainer)

const geometry = new PlaneBufferGeometry(1000, 1000)
const material = new MeshLambertMaterial({
  color: 0x777777,
})
const mesh = new Mesh(geometry, material)

mesh.castShadow = true
mesh.receiveShadow = true

scene.add(mesh)

const objects = query(select(Body))
const objectsCreated = query(select(Body), created)
const objectsDestroyed = query(select(Body), destroyed)

const objectsByEntity = new Map<number, Object3D>()

const tmpPosition = new Vector3()
const tmpRotation = new Quaternion()

export function maintainRenderSceneSystem(world: World) {
  for (const [sphere] of objectsCreated(world)) {
    const { _e: entity } = sphere
    const geometry = new SphereBufferGeometry(0.5, 32, 32)
    const material = new MeshLambertMaterial({
      color: 0xaa00dd,
    })
    const mesh = new Mesh(geometry, material)

    mesh.receiveShadow = true
    mesh.castShadow = true

    scene.add(mesh)
    objectsByEntity.set(entity, mesh)
  }

  for (const [sphere] of objectsDestroyed(world)) {
    const object = objectsByEntity.get(sphere._e)
    scene.remove(object)
  }
}

export function redraw(world: World, clock: Clock) {
  const { tickRate } = getServerDetails(world)
  const tick = (1 / tickRate) * 1000
  const alpha = clock.dt / tick

  const clientData = getClientData(world)
  const localPlayerObject = objectsByEntity.get(clientData.playerEntityLocal)

  for (const [body] of objects(world)) {
    const { _e: entity } = body
    const object = objectsByEntity.get(entity)
    const interpolatedTransform = world.tryGetComponent(
      entity,
      InterpolatedTransform,
    )

    tmpPosition.set(
      interpolatedTransform?.x || body.x,
      interpolatedTransform?.y || body.y,
      interpolatedTransform?.z || body.z,
    )
    tmpRotation.set(
      interpolatedTransform?.qx || body.qx,
      interpolatedTransform?.qy || body.qy,
      interpolatedTransform?.qz || body.qz,
      interpolatedTransform?.qw || body.qw,
    )

    object.position.lerp(tmpPosition, alpha)
    object.quaternion.slerp(tmpRotation, alpha)
  }

  // if (input) {
  //   const [pointerX, pointerY] = input.pointer
  //   quatX.setFromAxisAngle(AXIS_HORIZONTAL, pointerY)
  //   quatZ.setFromAxisAngle(AXIS_VERTICAL, pointerX)
  //   cameraContainer.quaternion.slerp(quatZ.multiply(quatX), alpha)
  // }

  if (localPlayerObject) {
    cameraContainer.position.lerp(localPlayerObject.position, alpha)
  }

  renderer.render(scene, camera)
}
