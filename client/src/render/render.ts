import { attached, detached, query, World } from "@javelin/ecs"
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
  BoxBufferGeometry,
} from "three"
import { getInputBuffer, getServerDetails, Sphere, Box } from "../../../common"
import { ClientTransform } from "../components"
import { getClientData } from "../queries"
import { createSky } from "./objects/sky"

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

const transforms = query(ClientTransform)
const transformsCreated = query(attached(ClientTransform))
const transformsDestroyed = query(detached(ClientTransform))

const objectsByEntity = new Map<number, Object3D>()

const tmpPosition = new Vector3()
const tmpRotation = new Quaternion()

function buildEntityGeometry(entity: number, world: World) {
  const sphere = world.tryGetComponent(entity, Sphere)

  if (sphere) {
    return new SphereBufferGeometry(sphere.radius, 32, 32)
  }

  const box = world.tryGetComponent(entity, Box)

  if (box) {
    return new BoxBufferGeometry(box.width, box.height, box.depth)
  }

  throw new Error("Can't create geometry for entity.")
}

export function maintainRenderSceneSystem(world: World) {
  for (const [entity] of transformsCreated(world)) {
    const geometry = buildEntityGeometry(entity, world)
    const material = new MeshLambertMaterial({
      color: 0xaa00dd,
    })
    const mesh = new Mesh(geometry, material)

    mesh.receiveShadow = true
    mesh.castShadow = true

    scene.add(mesh)
    objectsByEntity.set(entity, mesh)
  }

  for (const [entity] of transformsDestroyed(world)) {
    const object = objectsByEntity.get(entity)
    scene.remove(object)
  }
}

export function redraw(world: World, clock: Clock) {
  const { tickRate } = getServerDetails(world)
  const tick = (1 / tickRate) * 1000
  const alpha = clock.dt / tick

  const clientData = getClientData(world)
  const localPlayerObject = objectsByEntity.get(clientData.playerEntityLocal)

  for (const [entity, [{ x, y, z, qx, qy, qz, qw }]] of transforms(world)) {
    const object = objectsByEntity.get(entity)

    tmpPosition.set(x, y, z)
    tmpRotation.set(qx, qy, qz, qw)

    object.position.lerp(tmpPosition, alpha)
    object.quaternion.slerp(tmpRotation, alpha)
  }

  const { inputs } = getInputBuffer(world)

  const input = inputs[inputs.length - 1]

  if (localPlayerObject) {
    cameraContainer.position.copy(localPlayerObject.position)
    // cameraContainer.quaternion.copy(localPlayerObject.quaternion)
  }

  if (input) {
    const [, , , , , pointerX, pointerY] = input
    quatX.setFromAxisAngle(AXIS_HORIZONTAL, pointerY)
    quatZ.setFromAxisAngle(AXIS_VERTICAL, pointerX)
    cameraContainer.quaternion.slerp(quatZ.multiply(quatX), alpha)
  }

  renderer.render(scene, camera)
}
