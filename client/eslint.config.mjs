import { createRequire } from "node:module";

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import unusedImports from "eslint-plugin-unused-imports";
import { importX } from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

// eslint-config-next registers the react, react-hooks, import, jsx-a11y and
// @next/next plugins itself. Its eslint-plugin-import is fine on ESLint 10 for
// the one rule Next enables (no-anonymous-default-export), but import/order
// calls SourceCode APIs removed in ESLint 10, so ordering uses import-x/order. Resolve jsx-a11y through it so we reuse the exact
// same plugin instance (npm may nest it under eslint-config-next).
const requireFromNext = createRequire(
  import.meta.resolve("eslint-config-next"),
);
const jsxA11y = requireFromNext("eslint-plugin-jsx-a11y");

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "**/*.config.js",
    ],
  },
  // jsx-a11y recommended first so eslint-config-next's softer overrides win.
  {
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  ...nextCoreWebVitals,
  prettierRecommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "unused-imports": unusedImports,
      "import-x": importX,
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({ alwaysTryTypes: true }),
      ],
    },
    rules: {
      "no-console": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/exhaustive-deps": "off",
      // React Compiler rules from eslint-plugin-react-hooks v7 run at their
      // recommended level. set-state-in-effect stays a warning: the remaining
      // hit is the auth guard in src/hooks/useAuth.ts, left as-is on purpose.
      "react-hooks/set-state-in-effect": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "prettier/prettier": "warn",
      "no-unused-vars": "off",
      "unused-imports/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "@next/next/no-img-element": "off",
      "import-x/order": [
        "warn",
        {
          groups: [
            "type",
            "builtin",
            "object",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "~/**",
              group: "external",
              position: "after",
            },
          ],
          "newlines-between": "always",
        },
      ],
      "react/self-closing-comp": "warn",
      "react/jsx-sort-props": [
        "warn",
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],
    },
  },
];

export default eslintConfig;
