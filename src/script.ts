import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import * as dat from "lil-gui";
import { sizes, MovementTracker } from "./3d/utils"
import { CubeFace, RubiksCube } from "./cube";

// Debug
const gui = new dat.GUI({
  autoPlace: process.env.NODE_ENV === 'development'
});

// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLElement;

// Scene
const scene = new THREE.Scene();

/**
 * Lights
 */
 const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
 scene.add(ambientLight);
 
 const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
 directionalLight.castShadow = true;
 directionalLight.shadow.mapSize.set(1024, 1024);
 directionalLight.shadow.camera.far = 15;
 directionalLight.shadow.camera.left = -7;
 directionalLight.shadow.camera.top = 7;
 directionalLight.shadow.camera.right = 7;
 directionalLight.shadow.camera.bottom = -7;
 directionalLight.position.set(-10, 4, 8);
 scene.add(directionalLight);

//  scene.add(new THREE.DirectionalLightHelper(directionalLight))

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-3, 3, 5);
scene.add(camera);

// Controls
const orbit = new OrbitControls(camera, canvas);
// orbit.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Rubiks Cube
 */
const rubiksCube = new RubiksCube(scene)
const cursor = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const selected = new Map<string, THREE.Object3D>()
const updatable = new Set<CubeFace>()

let rotating: CubeFace | null = null
let clickIndex = 0;

function updatePointer (ev: PointerEvent) {
  pointer.x = ( ev.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( ev.clientY / window.innerHeight ) * 2 + 1;
}

window.addEventListener('pointermove', (ev) => {
  updatePointer(ev)
  cursor.setFromCamera(pointer, camera)
})

window.addEventListener('pointerdown', (ev) => {
  updatePointer(ev)
  cursor.setFromCamera(pointer, camera)
  const cubes = rubiksCube.getCubesByUUID()
  const cubeObjects = rubiksCube.getCubeObjects()
  const hovering = cursor.intersectObjects(cubeObjects)
  
  if (hovering.length) {
    const object = hovering[0].object
    selected.set(object.uuid, object)
    rubiksCube.autoRotate = false
    orbit.enabled = false

    const singleCube = cubes.get(object.parent.uuid)
    const isFacing = singleCube.isFacing()
    const sides = Object.keys(isFacing).filter((side: keyof typeof isFacing) => isFacing[side])
    const side = sides[clickIndex % sides.length]
    rotating = rubiksCube.getFace(side)

    if (rotating) {
      rotating.scale(1.05)
    }
  }

  clickIndex++
})

const movement = new MovementTracker()

window.addEventListener('pointermove', (ev) => {
  if (selected.size && rotating) {
    const { x, y} = movement.getMovement(ev);
    const diff = -(y + x) * 0.01;
    rotating.rotate(diff)
  } 
})

window.addEventListener('pointerup', () => {
  movement.clear()
  selected.clear()
  if (rotating) {
    rotating.scale(1)
    rotating.complete()
    updatable.add(rotating)
  }
  
  // rubiksCube.autoRotate = true
  orbit.enabled = true
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const deltaTime = clock.getDelta();
  const elapsedTime = clock.elapsedTime;
  
  // Update controls
  orbit.update();
  rubiksCube.update({ deltaTime });
  updatable.forEach(object => {
    const updated = object.update({ deltaTime })
    if (!updated) updatable.delete(object)
  })

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
