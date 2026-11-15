import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist", "**/dist-server", "**/storybook-static", "apps/blog/config/"] },
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
    },
  },
  {
    // @brianlusina/cms's root entry is imported by the browser: it must not reach a CMS client, the
    // credentials or Node. Those live behind packages/cms/server.ts.
    files: ["packages/cms/index.ts", "packages/cms/src/{types,adapter,aggregator}.ts", "packages/cms/src/notion/properties.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["./contentful*", "./contentful/**", "./src/contentful/**", "./notion/client*", "./notion/source*", "./src/notion/client*", "./src/notion/source*", "./server", "../server"], message: "Server-only: import it from @brianlusina/cms/server, never from the browser-safe entry." },
          { group: ["@notionhq/*", "notion-to-md", "node:*"], message: "Server-only: keep CMS clients and Node out of the browser-safe entry." },
        ],
      }],
    },
  },
  {
    // Playwright fixtures call a parameter named `use`, which the React hooks rule mistakes for a hook.
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    languageOptions: { globals: globals.node },
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
);
