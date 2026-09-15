/**
 * Historia AI — P7 Runtime State Integrity
 *
 * Contract helpers for the static-geometry / dynamic-state separation:
 *
 *  - Static geometry authority (mapbin geometry, tiles, ids, palette) is
 *    immutable at runtime.
 *  - Dynamic political state (owner/controller/occupation) lives in the
 *    province fields section of the same buffer and is the ONLY region
 *    gameplay mutation may touch.
 *  - Province sections must never overlap the static geometry sections.
 *
 * These helpers are deterministic and allocation-light; runtime dev builds
 * can call assertStaticGeometryUnchanged after state mutation batches to
 * catch accidental writes into the immutable authority region.
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** Deterministic FNV-1a checksum over a byte range of an ArrayBuffer. */
export function regionChecksum(buffer, byteOffset, byteLength) {
  if (!(buffer instanceof ArrayBuffer)) throw new TypeError("regionChecksum requires ArrayBuffer");
  if (!Number.isInteger(byteOffset) || byteOffset < 0 || byteOffset < 0) throw new TypeError("invalid checksum range");
  if (byteOffset + byteLength > buffer.byteLength) throw new RangeError("checksum range out of bounds");
  const bytes = new Uint8Array(buffer, byteOffset, byteLength);
  let hash = FNV_OFFSET;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i];
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash;
}

function section(name, offset, byteLength) {
  if (!Number.isInteger(offset) || offset < 0) throw new TypeError(`${name} offset must be a non-negative integer`);
  if (!Number.isInteger(byteLength) || byteLength < 0) throw new TypeError(`${name} byteLength must be a non-negative integer`);
  return { name, offset, end: offset + byteLength };
}

/** All mapbin sections derived from the frozen asset header. */
export function mapbinSections(header) {
  return [
    section("provinceFields", header.provinceOffset, Number(header.provinceCount) * 32),
    section("tileIndex", header.tileOffset, Number(header.tileCount) * 24),
    section("geometry", header.geometryOffset, Number(header.geometryPointCount) * 8),
    section("lodRanges", header.lodOffset, Number(header.lodRangeCount) * 16),
    section("palette", header.paletteOffset, Number(header.paletteByteLength)),
  ];
}

/**
 * Fail-closed section disjointness: no mapbin section may overlap another.
 * Throws with a full violation list; returns the sorted sections.
 */
export function assertMapbinSectionsDisjoint(header) {
  const sections = mapbinSections(header).sort((a, b) => a.offset - b.offset);
  const violations = [];
  for (let i = 0; i < sections.length; i += 1) {
    for (let j = i + 1; j < sections.length; j += 1) {
      if (sections[j].offset < sections[i].end) {
        violations.push(`${sections[i].name} [${sections[i].offset}, ${sections[i].end}) overlaps ${sections[j].name} [${sections[j].offset}, ${sections[j].end})`);
      }
    }
  }
  if (violations.length) throw new Error(`Mapbin section layout violation (${violations.length}):\n- ${violations.join("\n- ")}`);
  return sections;
}

/**
 * Snapshot the static authority regions (everything except the mutable
 * province fields section) as deterministic checksums.
 */
export function captureStaticGeometryChecksum(buffer, header) {
  assertMapbinSectionsDisjoint(header);
  const staticSections = mapbinSections(header).filter((item) => item.name !== "provinceFields");
  const checksums = {};
  for (const item of staticSections) checksums[item.name] = regionChecksum(buffer, item.offset, item.end - item.offset);
  return checksums;
}

/**
 * Assert the static authority regions are byte-identical to the snapshot.
 * Throws with a full violation list when any static region changed.
 */
export function assertStaticGeometryUnchanged(buffer, header, snapshot) {
  assertMapbinSectionsDisjoint(header);
  const staticSections = mapbinSections(header).filter((item) => item.name !== "provinceFields");
  const violations = [];
  for (const item of staticSections) {
    const current = regionChecksum(buffer, item.offset, item.end - item.offset);
    if (current !== snapshot[item.name]) {
      violations.push(`static ${item.name} region changed (was ${snapshot[item.name]}, now ${current})`);
    }
  }
  if (violations.length) throw new Error(`Static geometry authority violated (${violations.length}):\n- ${violations.join("\n- ")}`);
  return true;
}
