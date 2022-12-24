import {
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  Color,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Scene,
  Group,
  Quaternion,
} from "three";

const black = new Color(0x352f38);

const faceColors = {
  right: new Color(0x00ffff),
  left: new Color(0x00ff00),
  top: new Color(0xffffff),
  bottom: new Color(0xffff00),
  front: new Color(0x0000ff),
  back: new Color(0xff0000),
};

export class RubiksCube {
  group: Group
  cubes: CubeSingle[] = [];
  autoRotate = false

  constructor(public scene: Scene) {
    this.init();
  }

  init() {
    this.group = new Group();
    this.scene.add(this.group);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const vec3 = new Vector3(x, y, z);
          const cube = new CubeSingle(vec3);
          this.cubes.push(cube);
          this.group.add(cube.group);
        }
      }
    }
  }

  getCubesByUUID () {
    const cubesByUUID = new Map<string, CubeSingle>();
    for (const cube of this.cubes) {
      cubesByUUID.set(cube.group.uuid, cube)
    }
    return cubesByUUID
  }

  getCubeObjects () {
    return this.cubes.map(c => c.group)
  }

  getFaces () {
    return {
      right: this.rightFacingCubes(),
      left: this.leftFacingCubes(),
      top: this.topFacingCubes(),
      bottom: this.bottomFacingCubes(),
      front: this.frontFacingCubes(),
      back: this.backFacingCubes(),
    }
  }

  update ({ deltaTime }: { deltaTime: number }) {
    if (this.autoRotate) {
      this.group.rotation.x += deltaTime * 0.15
      this.group.rotation.y += deltaTime * 0.1
      this.group.rotation.z += deltaTime * 0.05
    }
  }

  rightFacingCubes() {
    return new CubeFaceLeftRight(
      this,
      this.cubes.filter((c) => c.isRightFacing())
    );
  }

  leftFacingCubes() {
    return new CubeFaceLeftRight(
      this,
      this.cubes.filter((c) => c.isLeftFacing())
    );
  }

  topFacingCubes() {
    return new CubeFaceTopBottom(
      this,
      this.cubes.filter((c) => c.isTopFacing()),
      -1
    );
  }

  bottomFacingCubes() {
    return new CubeFaceTopBottom(
      this,
      this.cubes.filter((c) => c.isBottomFacing()),
      -1
    );
  }

  frontFacingCubes() {
    return new CubeFaceFrontBack(
      this,
      this.cubes.filter((c) => c.isFrontFacing())
    );
  }

  backFacingCubes() {
    return new CubeFaceFrontBack(
      this,
      this.cubes.filter((c) => c.isBackFacing())
    );
  }
}

export class CubeFace {
  private qturn = 0
  private qturnTo = 0
  private easing = 10
  
  axis = new Vector3(1, 0, 0);

  constructor(public cube: RubiksCube, public cubes: CubeSingle[], public direction = 1) {}
  
  rotate (qturns = 1) {
    if (this.cubes.length === 9) {
      this.qturn += qturns
      for (const cube of this.cubes) {
        // const tmpGroup = cube.group
        // cube.group = new Group();
        // cube.group.add(tmpGroup);
        cube.group.rotateOnWorldAxis(this.axis, Math.PI / 2 * qturns * this.direction);
        // this.cube.group.add(cube.group)
      }
    }
  }

  scale (value = 1) {
    for (const cube of this.cubes) {
      cube.group.scale.set(value, value, value)
    }
  }
  
  complete () {
    const finish = Math.round(this.qturn)
    this.qturnTo = finish - this.qturn
  }

  update ({ deltaTime }: { deltaTime: number }) {
    const v = this.qturnTo * this.easing * deltaTime
    this.qturnTo -= v
    this.rotate(v)

    if (this.qturnTo > 0) {
      return this.qturnTo > 1e-6
    }
    return this.qturnTo < -1e-6
  }
}

class CubeFaceLeftRight extends CubeFace {
  axis = new Vector3(1, 0, 0);
}

class CubeFaceTopBottom extends CubeFace {
  axis = new Vector3(0, -1, 0);
}

class CubeFaceFrontBack extends CubeFace {
  axis = new Vector3(0, 0, -1);
}

class CubeSingle {
  group: Group;
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
  container: Mesh;
  mesh: Mesh;

  constructor(public position: Vector3) {
    this.init();
  }

  isRightFace() {
    return this.position.x === 1;
  }

  isLeftFace() {
    return this.position.x === -1;
  }

  isTopFace() {
    return this.position.y === 1;
  }

  isBottomFace() {
    return this.position.y === -1;
  }

  isFrontFace() {
    return this.position.z === 1;
  }

  isBackFace() {
    return this.position.z === -1;
  }

  facing() {
    const worldPos = new Vector3();
    this.mesh.getWorldPosition(worldPos);
    return worldPos;
    // return this.mesh.position
  }

  isFacing () {
    const facing = this.facing()
    return {
      right: facing.x > 0.5,
      left: facing.x < -0.5,
      top: facing.y > 0.5,
      bottom: facing.y < -0.5,
      front: facing.z > 0.5,
      back: facing.z < -0.5,
    }
  }

  isRightFacing() {
    return this.facing().x > 0.5;
  }

  isLeftFacing() {
    return this.facing().x < -0.5;
  }

  isTopFacing() {
    return this.facing().y > 0.5;
  }

  isBottomFacing() {
    return this.facing().y < -0.5;
  }

  isFrontFacing() {
    return this.facing().z > 0.5;
  }

  isBackFacing() {
    return this.facing().z < -0.5;
  }

  faceColors() {
    const faces = new Array(6).fill(black);

    // COLORS EVEN INTERIOR FACES
    // faces[0] = faceColors.right
    // faces[1] = faceColors.left
    // faces[2] = faceColors.top
    // faces[3] = faceColors.bottom
    // faces[4] = faceColors.front
    // faces[5] = faceColors.back

    // COLORS ONLY EXTERIOR FACES
    if (this.isRightFace()) faces[0] = faceColors.right;
    if (this.isLeftFace()) faces[1] = faceColors.left;
    if (this.isTopFace()) faces[2] = faceColors.top;
    if (this.isBottomFace()) faces[3] = faceColors.bottom;
    if (this.isFrontFace()) faces[4] = faceColors.front;
    if (this.isBackFace()) faces[5] = faceColors.back;

    return faces;
  }

  init() {
    this.group = new Group();
    // this.container = new Mesh(
    //   new BoxGeometry(3, 3, 3),
    //   new MeshBasicMaterial({ transparent: true, opacity: 0 }),
    // )

    // this.group.add(this.container)

    this.geometry = new BoxGeometry(1, 1, 1).toNonIndexed();
    this.material = new MeshStandardMaterial({
      vertexColors: true,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    const faces = this.faceColors();
    const colors = [];

    const positionAttribute = this.geometry.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i += 6) {
      const color = faces[i / 6];
      // define the same color for each vertex of a face
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    }

    this.geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

    this.mesh.position.set(
      this.position.x * 1.05,
      this.position.y * 1.05,
      this.position.z * 1.05
    );
  }
}
