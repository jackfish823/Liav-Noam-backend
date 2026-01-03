/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    roots: ["<rootDir>/src/tests"],
};