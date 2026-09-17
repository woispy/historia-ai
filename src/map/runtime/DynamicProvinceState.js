/**
 * Historia AI — P7 Dynamic Province State
 *
 * Separates dynamic political state (owner/controller/occupation) from
 * static geometry authority. The mapbin transport contains ONLY static
 * geometry (ids, bounds, geometry, tiles, palette). Dynamic state lives
 * in separate GPU buffers that can be mutated at runtime without
 * invalidating the static geometry authority.
 *
 * Contract:
 *  - Static geometry authority is immutable (validated by RuntimeStateIntegrity)
 *  - Dynamic state (owner/controller/occupation) lives in separate GPU buffers
 *  - Mutations are validated (numeric IDs, range checks)
 *  - Dirty regions are tracked for efficient GPU upload
 *  - State mutations never touch static geometry buffers
 */

const STATE_FIELD_COUNT = 3; // owner, controller, occupation

/**
 * Dynamic province state — zero-copy views over a dedicated state buffer.
 * The buffer layout: [owner, controller, occupation] each uint32[count]
 */
export class DynamicProvinceState {
  constructor(count) {
    if (!Number.isInteger(count) || count < 0) throw new TypeError("count must be a non-negative integer");
    this.count = count;
    this.buffer = new ArrayBuffer(count * STATE_FIELD_COUNT * 4);
    this.owner = new Uint32Array(this.buffer, 0, count);
    this.controller = new Uint32Array(this.buffer, count * 4, count);
    this.occupation = new Uint32Array(this.buffer, count * 2 * 4, count);
    this.dirty = new Uint8Array(count); // 0=clean, 1=owner, 2=controller, 4=occupation, bitwise
    this.version = 0;
  }

  static fromCount(count) {
    return new DynamicProvinceState(count);
  }

  /**
   * Create from an existing buffer (e.g., initialized from mapbin owner + defaults).
   */
  static fromBuffer(buffer, count) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError("DynamicProvinceState requires ArrayBuffer");
    const expected = count * STATE_FIELD_COUNT * 4;
    if (buffer.byteLength < expected) throw new RangeError("Buffer too small for dynamic state");
    const state = Object.create(DynamicProvinceState.prototype);
    state.count = count;
    state.buffer = buffer;
    state.owner = new Uint32Array(buffer, 0, count);
    state.controller = new Uint32Array(buffer, count * 4, count);
    state.occupation = new Uint32Array(buffer, count * 2 * 4, count);
    state.dirty = new Uint8Array(count);
    state.version = 0;
    return state;
  }

  /**
   * Initialize from mapbin owner + defaults for controller/occupation.
   */
  static fromMapbinOwner(mapbinOwner) {
    const count = mapbinOwner.length;
    const state = new DynamicProvinceState(count);
    state.owner.set(mapbinOwner);
    // Default: controller = owner, occupation = 0 (unoccupied)
    state.controller.set(mapbinOwner);
    // occupation already 0
    state.version = 1;
    return state;
  }

  // --- Mutation API (fail-closed validation) ---

  setOwner(index, value) {
    this._validateIndex(index);
    const numeric = this._toNumericId(value);
    if (this.owner[index] !== numeric) {
      this.owner[index] = numeric;
      this.dirty[index] |= 1;
      this.version++;
    }
    return this;
  }

  setController(index, value) {
    this._validateIndex(index);
    const numeric = this._toNumericId(value);
    if (this.controller[index] !== numeric) {
      this.controller[index] = numeric;
      this.dirty[index] |= 2;
      this.version++;
    }
    return this;
  }

  setOccupation(index, value) {
    this._validateIndex(index);
    const numeric = this._toNumericId(value);
    if (this.occupation[index] !== numeric) {
      this.occupation[index] = numeric;
      this.dirty[index] |= 4;
      this.version++;
    }
    return this;
  }

  /** Batch set for initialization/performance. */
  setAll({ owner, controller, occupation }) {
    if (owner) this.owner.set(owner);
    if (controller) this.controller.set(controller);
    if (occupation) this.occupation.set(occupation);
    this.dirty.fill(7); // all dirty
    this.version++;
    return this;
  }

  /** Get current values (read-only view). */
  get(index) {
    this._validateIndex(index);
    return {
      owner: this.owner[index],
      controller: this.controller[index],
      occupation: this.occupation[index],
    };
  }

  getOwner(index) { this._validateIndex(index); return this.owner[index]; }
  getController(index) { this._validateIndex(index); return this.controller[index]; }
  getOccupation(index) { this._validateIndex(index); return this.occupation[index]; }

  getAll() {
    return {
      owner: this.owner.slice(),
      controller: this.controller.slice(),
      occupation: this.occupation.slice(),
    };
  }

  // --- Dirty tracking & GPU upload ---

  /** Returns indices of dirty provinces since last flush. */
  getDirtyIndices() {
    const indices = [];
    for (let i = 0; i < this.count; i += 1) {
      if (this.dirty[i]) indices.push(i);
    }
    return indices;
  }

  /** Mark specific indices as clean after GPU upload. */
  markClean(indices) {
    for (const i of indices) this.dirty[i] = 0;
  }

  /** Mark all clean after full upload. */
  markAllClean() { this.dirty.fill(0); }

  /** Mark every province dirty (force full GPU re-upload). */
  markAllDirty() { this.dirty.fill(7); }

  // --- Validation ---

  _validateIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) {
      throw new RangeError(`Province index ${index} out of bounds [0, ${this.count})`);
    }
  }

  _toNumericId(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new TypeError("State value must be a non-negative finite integer");
    return n >>> 0;
  }

  // --- Serialization / GPU buffer access ---

  /** Get the underlying ArrayBuffer for GPU upload. */
  getBuffer() { return this.buffer; }

  /** Get sub-buffer views for partial GPU upload. */
  getOwnerView() { return this.owner; }
  getControllerView() { return this.controller; }
  getOccupationView() { return this.occupation; }

  /** Full state buffer for complete GPU upload. */
  getStateBuffer() { return this.buffer; }

  /**
   * P7: build a province color provider for the CPU/WebGL render path.
   * Returns fn(provinceId, provinceIndex) -> [r,g,b] resolved from the
   * owner palette; unowned/unknown resolve to the neutral color.
   *
   * @param {object} options
   *   - assetSource: BinaryMapAssetSource (provinceId -> index mapping)
   *   - palette: plain object ownerId -> [r,g,b] (0..255)
   *   - neutral: [r,g,b] fallback (default 0x6f765f)
   */
  createColorProvider({ assetSource, palette, neutral = [111, 118, 95] } = {}) {
    if (!assetSource || typeof assetSource.indexOf !== "function") throw new TypeError("assetSource with indexOf is required");
    const table = palette ?? {};
    return (provinceId, provinceIndex) => {
      const index = assetSource.indexOf(provinceId);
      const resolved = Number.isInteger(index) && index >= 0 ? index : Number(provinceIndex);
      if (!Number.isInteger(resolved) || resolved < 0 || resolved >= this.count) return neutral;
      const owner = this.owner[resolved];
      if (!owner) return neutral;
      const color = table[owner];
      return Array.isArray(color) ? color : neutral;
    };
  }

  // --- Integrity ---

  /** Verify state buffer integrity (no NaN, valid ranges). */
  validateIntegrity() {
    for (let i = 0; i < this.count; i += 1) {
      if (!Number.isInteger(this.owner[i]) || this.owner[i] > 0xFFFFFFFF) return false;
      if (!Number.isInteger(this.controller[i]) || this.controller[i] > 0xFFFFFFFF) return false;
      if (!Number.isInteger(this.occupation[i]) || this.occupation[i] > 0xFFFFFFFF) return false;
    }
    return true;
  }
}

export const DYNAMIC_STATE_FIELDS = Object.freeze(["owner", "controller", "occupation"]);
export const DYNAMIC_STATE_FIELD_COUNT = STATE_FIELD_COUNT;
export default DynamicProvinceState;