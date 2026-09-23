/**
 * Historia AI — P7 Political State Bridge
 *
 * Connects game mechanics to the dynamic political state API. Game events
 * (conquest, occupation, liberation, restoration) map to fail-closed state
 * mutations on ProvinceRuntimeState, with an audit trail, and flush through
 * the DynamicStateUploader to GPU:
 *
 *  - transfer(provinceId, newOwnerId): full conquest — owner AND controller
 *    become the new owner.
 *  - occupy(provinceId, occupierId): military occupation — controller becomes
 *    the occupier while the legitimate owner is unchanged.
 *  - liberate(provinceId): occupation ends — controller returns to the
 *    legitimate owner.
 *  - restore(provinceId, ownerId): peace settlement — full reset to the
 *    legitimate owner (owner + controller + occupation cleared).
 *
 * Every operation validates the province exists (fail-closed), records an
 * audit entry, and mutations accumulate as dirty provinces. flush(device)
 * uploads the batch to GPU and asserts static geometry integrity.
 */

const EVENT_TYPES = Object.freeze(["transfer", "occupy", "liberate", "restore"]);

export class PoliticalStateBridge {
  constructor({ runtimeState, uploader = null, clock = null } = {}) {
    if (!runtimeState?.dynamicState) throw new TypeError("runtimeState with dynamicState is required");
    this.runtimeState = runtimeState;
    this.dynamicState = runtimeState.dynamicState;
    this.uploader = uploader;
    this.clock = clock ?? (() => new Date().toISOString());
    this.audit = [];
  }

  _resolve(provinceId) {
    const index = this.runtimeState.indexOf(provinceId);
    if (index < 0) throw new RangeError(`Unknown province: ${provinceId}`);
    return index;
  }

  _apply(type, provinceId, index, detail) {
    const entry = {
      seq: this.audit.length + 1,
      type,
      provinceId,
      at: this.clock(),
      ...detail,
    };
    this.audit.push(entry);
    return entry;
  }

  /** Full conquest: owner AND controller become the new owner. */
  transfer(provinceId, newOwnerId) {
    const index = this._resolve(provinceId);
    const previousOwner = this.dynamicState.owner[index];
    this.dynamicState.setOwner(index, newOwnerId);
    this.dynamicState.setController(index, newOwnerId);
    return this._apply("transfer", provinceId, index, { from: previousOwner, to: newOwnerId });
  }

  /** Military occupation: controller = occupier, owner unchanged. */
  occupy(provinceId, occupierId) {
    const index = this._resolve(provinceId);
    const previousController = this.dynamicState.controller[index];
    const owner = this.dynamicState.owner[index];
    if (owner !== 0 && owner === occupierId) {
      throw new RangeError(`Cannot occupy ${provinceId}: the occupier is already the legitimate owner`);
    }
    this.dynamicState.setController(index, occupierId);
    return this._apply("occupy", provinceId, index, { owner, from: previousController, to: occupierId });
  }

  /** Occupation ends: controller returns to the legitimate owner. */
  liberate(provinceId) {
    const index = this._resolve(provinceId);
    const owner = this.dynamicState.owner[index];
    const previousController = this.dynamicState.controller[index];
    if (previousController === owner) throw new RangeError(`Cannot liberate ${provinceId}: province is not occupied`);
    this.dynamicState.setController(index, owner);
    return this._apply("liberate", provinceId, index, { owner, from: previousController, to: owner });
  }

  /** Peace settlement: full reset to the legitimate owner, occupation cleared. */
  restore(provinceId, ownerId) {
    const index = this._resolve(provinceId);
    const previousOwner = this.dynamicState.owner[index];
    this.dynamicState.setOwner(index, ownerId);
    this.dynamicState.setController(index, ownerId);
    this.dynamicState.setOccupation(index, 0);
    return this._apply("restore", provinceId, index, { from: previousOwner, to: ownerId });
  }

  /** Apply a game event by type. Unknown event types are rejected. */
  applyEvent({ type, provinceId, actorId }) {
    if (!EVENT_TYPES.includes(type)) throw new RangeError(`Unknown event type: ${type}`);
    switch (type) {
      case "transfer": return this.transfer(provinceId, actorId);
      case "occupy": return this.occupy(provinceId, actorId);
      case "liberate": return this.liberate(provinceId);
      case "restore": return this.restore(provinceId, actorId);
      default: throw new RangeError(`Unhandled event type: ${type}`);
    }
  }

  /** Upload the accumulated dirty mutations to GPU (no-op when clean). */
  flush(device) {
    if (!this.uploader) throw new Error("No DynamicStateUploader attached; flush unavailable");
    const uploaded = this.uploader.uploadDirty(device);
    this.uploader.assertStaticGeometryIntact();
    return uploaded;
  }

  /** Audit trail (defensive copy). */
  getHistory() { return this.audit.map((entry) => ({ ...entry })); }

  /** Current state of a province (owner/controller/occupation). */
  getState(provinceId) {
    const index = this._resolve(provinceId);
    return this.dynamicState.get(index);
  }
}

export const politicalStateEventTypes = EVENT_TYPES;
export default PoliticalStateBridge;
