import tsParser from "@typescript-eslint/parser"

export default [
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    ignores: ["**/.next/**", "**/node_modules/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {},
  },
]

