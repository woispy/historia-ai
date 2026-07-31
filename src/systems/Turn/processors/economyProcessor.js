import {
  getRuntimeState,
} from "../../../state/runtime";

/**
 * Processes economy simulation.
 *
 * Placeholder implementation.
 * Supports both the legacy GameState and the new GameSession runtime.
 */
export function processEconomy(runtime) {
  // Runtime'ı okuyarak yeni mimariye uyum sağlıyoruz.
  // Gerçek ekonomi simülasyonu ileride burada çalışacak.
  getRuntimeState(runtime);

  return runtime;
}