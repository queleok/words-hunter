module.exports = {
    preset: "jest-puppeteer",
    globals: {
        URL: "http://localhost:8080",
        'ts-jest': {
            useESM: true
        }
    },
    roots: [
        "<rootDir>/src/scripts"
    ],
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    transform: {
        "^.+\\.(js|ts|tsx)$": "ts-jest"
    },
    collectCoverage: true,
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        "./generate-letters.js": "./generate-letters.ts",
    }
}
