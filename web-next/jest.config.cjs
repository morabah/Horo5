/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.unit.spec.ts"],
  modulePathIgnorePatterns: ["/.next/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-router-dom$": "<rootDir>/src/lib/react-router-dom-shim.tsx",
    "^react-helmet-async$": "<rootDir>/src/lib/react-helmet-async-shim.tsx",
  },
  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true },
          transform: { react: { runtime: "automatic" } },
        },
      },
    ],
  },
}
