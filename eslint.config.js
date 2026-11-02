import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// React.lazy breaks for good after a deploy replaces the chunk hashes; the wrapper reloads once.
const LAZY_MESSAGE = "Use `lazy` from '@/lib/chunkReload' instead of React's, so a chunk that fails after a deploy reloads the page.";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Not no-restricted-imports with importNames: that also flags every `import * as React`.
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value='react'] > ImportSpecifier[imported.name='lazy']",
          message: LAZY_MESSAGE,
        },
      ],
      "no-restricted-properties": [
        "error",
        { object: "React", property: "lazy", message: LAZY_MESSAGE },
      ],
    },
  },
  {
    files: ["src/lib/chunkReload.ts"],
    rules: {
      "no-restricted-syntax": "off",
      "no-restricted-properties": "off",
    },
  },
);
