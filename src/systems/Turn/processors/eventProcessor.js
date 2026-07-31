import {
  getRuntimeState,
} from "../../../state/runtime";

/**
 * Processes world events.
 *
 * Placeholder implementation.
 * Supports both the legacy GameState and the new GameSession runtime.
 */
export function processEvents(runtime) {
  // Runtime'ı okuyarak yeni mimariye uyum sağlıyoruz.
  // İleride event sistemi burada çalışacak.
  getRuntimeState(runtime);

  return runtime;
}