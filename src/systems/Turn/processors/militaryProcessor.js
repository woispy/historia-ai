import {
  getRuntimeState,
} from "../../../state/runtime";

/**
 * Processes military simulation.
 *
 * Placeholder implementation.
 * Supports both the legacy GameState and the new GameSession runtime.
 */
export function processMilitary(runtime) {
  // Runtime'ı okuyarak yeni mimariye uyum sağlıyoruz.
  // Gerçek askeri simülasyon ileride burada çalışacak.
  getRuntimeState(runtime);

  return runtime;
}