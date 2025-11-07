import { pathsToModuleNameMapper } from 'ts-jest';
import type { Config } from 'jest';
import ts, { convertCompilerOptionsFromJson } from 'typescript';

const configFileName = ts.findConfigFile(
  './',
  ts.sys.fileExists,
  'tsconfig.json'
);
const configFile = ts.readConfigFile(configFileName!, ts.sys.readFile);
const compilerOptions = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  './'
);

const jestConfig: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.options.paths!, {
    prefix: '<rootDir>/',
  }),
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.constant.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};

export default jestConfig;
