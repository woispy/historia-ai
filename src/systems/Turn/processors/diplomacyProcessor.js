import {
  getRuntimeState,
} from "../../../state/runtime";

/**
 * Processes diplomacy simulation.
 *
 * Placeholder implementation.
 * Supports both the legacy GameState and the new GameSession runtime.
 */
export function processDiplomacy(runtime) {
  // Runtime'ı okuyarak yeni mimariye uyum sağlıyoruz.
  // Gerçek diplomasi simülasyonu ileride burada çalışacak.
  getRuntimeState(runtime);

  return runtime;
}