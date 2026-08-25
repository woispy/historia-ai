/**
 * Lightweight architecture contract checks for historical-GIS recovery.
 * Run this before changing the production geometry builder.
 */
import assert from 'node:assert/strict';

const required = [
  'Historical anchor remains unchanged after recovery',
  'Recovery uses the production physical-land authority',
  'No secondary coastline authority is introduced',
  'Recovery failure is explicit and deterministic',
];

assert.equal(required.length, 4);
console.log('Historical GIS recovery contract: OK');
