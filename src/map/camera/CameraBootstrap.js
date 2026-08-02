/**
 * ============================================================================
 * Historia AI
 * Camera Bootstrap
 * ============================================================================
 *
 * Creates the initial Camera Engine state.
 */

import {
  createCameraRepository,
} from "./CameraRepository";

/**
 * Bootstraps Camera Engine.
 */
export function bootstrapCamera() {
  return createCameraRepository();
}