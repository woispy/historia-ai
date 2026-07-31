/**
 * ============================================================================
 * Historia AI
 * Province Selection
 * ============================================================================
 *
 * Stores the current map selection.
 *
 * Future:
 * - City
 * - Army
 * - Character
 */

const state = {
  provinceId: null,
};

const listeners = new Set();

function emit() {
  for (const listener of listeners) {
    listener({
      ...state,
    });
  }
}

export function getProvinceSelection() {
  return {
    ...state,
  };
}

export function getSelectedProvinceId() {
  return state.provinceId;
}

export function selectProvince(provinceId) {
  if (state.provinceId === provinceId) {
    return;
  }

  state.provinceId = provinceId;

  emit();
}

export function clearProvinceSelection() {
  state.provinceId = null;

  emit();
}

export function subscribeProvinceSelection(listener) {
  listeners.add(listener);

  listener(getProvinceSelection());

  return () => {
    listeners.delete(listener);
  };
}