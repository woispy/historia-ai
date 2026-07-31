import {
  getRuntimeState,
} from "../../../state/runtime";

/**
 * Processes population simulation.
 *
 * Placeholder implementation.
 * Supports both the legacy GameState and the new GameSession runtime.
 */
export function processPopulation(runtime) {
  // Runtime'ı okuyarak yeni mimariye uyum sağlıyoruz.
  // Gerçek nüfus simülasyonu ileride burada çalışacak.
  getRuntimeState(runtime);

  return runtime;
}