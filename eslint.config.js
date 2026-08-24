import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    // Historical Phase 2D builder snapshots are retained for auditability;
    // V9 is the active geometry authority and the only builder under test.
    "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV6.js",
    "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV7.js",
    "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV8.js",
  ]),
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
]);
