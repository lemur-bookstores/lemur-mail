// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.ts", "<rootDir>/src/**/*.test.ts"],
  // Vuelve a ignorar todo en node_modules
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: {
    // Solo ts-jest para tus archivos TS
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
    // ELIMINA la regla de babel-jest para .js
  },
  // ELIMINA .mjs y .cjs si no los necesitas más en moduleFileExtensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], // Simplificado

  // Puedes eliminar extensionsToTreatAsEsm si no hay problemas con otras ESMs
  // o dejarlo vacío si quieres ser explícito que nada se trata como ESM por extensión.
  // extensionsToTreatAsEsm: [],

  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/**/*.d.ts",
    "!src/providers/index.ts",
  ],
  setupFilesAfterEnv: [],
};
