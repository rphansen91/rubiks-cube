import { Vector2 } from "three";

/**
 * Sizes
 */
export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Cursor
 */

export const cursor = { x: 0, y: 0 };
document.addEventListener("mousemove", (ev) => {
  cursor.x = ev.clientX;
  cursor.y = ev.clientY;
});


/**
 * Movement
 */

export class MovementTracker {
  previous: THREE.Vector2 | null

  getMovement (ev: PointerEvent) {
    let x = 0, y = 0;

    if (this.previous) {
      x = this.previous.x - ev.clientX
      y = this.previous.y - ev.clientY
    }

    this.previous = new Vector2(ev.clientX, ev.clientY)

    return { x, y  }
  }

  clear () {
    this.previous = null
  }
}