/**
 * ============================================================================
 * Historia AI
 * City Model
 * ============================================================================
 */

export function createCityModel(data) {
  return Object.freeze({
    ...data,

    status: Object.freeze({
      underSiege:
        data.status?.underSiege ??
        false,

      looted:
        data.status?.looted ??
        false,

      occupied:
        data.status?.occupied ??
        false,
    }),
  });
}