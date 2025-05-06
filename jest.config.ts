import type {Config} from 'jest';

const config: Config = {
  "preset": "ts-jest",
  "coveragePathIgnorePatterns": [
    "<rootDir>/test/"
  ],
  "transform": {
    "\\.[jt]sx?$": [
      "ts-jest",
      {
        "tsconfig": {
          "noImplicitReturns": false,
          "noFallthroughCasesInSwitch": false,
          "noUnusedLocals": false,
          "noUnusedParameters": false
        }
      }
    ]
  },
  "globals": {
    "__DEV__": true
  },
  prettierPath: require.resolve('prettier-2'),
};

export default config;
