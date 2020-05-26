module.exports = {
  preset: "@vue/cli-plugin-unit-jest",
  "moduleFileExtensions": [
    "js",
    "json",
    "vue"
  ],
  "transform": {
    ".*\\.(vue)$": "vue-jest",
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^assets/(.*)$": "<rootDir>/src/assets/$1",
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "^views/(.*)$": "<rootDir>/src/views/$1",
    "^api/(.*)$": "<rootDir>/src/api/$1",
    "^icons/(.*)$": "<rootDir>/src/icons/$1",
    "^router/(.*)$": "<rootDir>/src/router/$1",
    "^store/(.*)$": "<rootDir>/src/store/$1",
    "^utils/(.*)$": "<rootDir>/src/utils/$1",
    "^style/(.*)$": "<rootDir>/src/style/$1",
    "^locales/(.*)$": "<rootDir>/src/locales/$1",
    "^plugins/(.*)$": "<rootDir>/src/plugins/$1"
  },
  "collectCoverage": true,
  "collectCoverageFrom": ["**/*.{js,vue}", "!**/node_modules/**"],
  "coverageReporters": ["html", "text-summary"]
};
