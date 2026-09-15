import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // GPU cleanup paths intentionally ignore teardown failures; no-empty
      // still protects every other empty block.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["tools/**/*.js", "vite.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["src/map/rendering/gpu/ProvinceTextureLayer.jsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/map/rendering/gpu/WebGPUMapRenderer.js"],
    rules: {
      // Retain the shader-side ID_CLEAR constant as a documented WGSL encoding
      // contract even though the current picking path does not consume it.
      "no-unused-vars": ["error", { varsIgnorePattern: "^ID_CLEAR$" }],
    },
  },
  {
    files: ["tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js"],
    rules: {
      // Phase2D is retained as a legacy/reference geometry builder only. Its
      // unused compatibility helpers are deliberately outside the production
      // authority path and must not block the current canonical pipeline.
      "no-unused-vars": ["error", {
        varsIgnorePattern: "^(closestPointOnSegment|sequence|addProvinceMicroSites|buildVoronoiCell|buildLandSafeCell)$",
        argsIgnorePattern: "^_",
      }],
    },
  },
]);
