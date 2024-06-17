import type {Config} from "@jest/types";

const config: Config.InitialOptions = {
	roots: ["<rootDir>/test"],
	verbose: true,
	preset: "ts-jest",
	testEnvironment: "node",
	transform: {
		"^.+\\.ts?$": [
			"ts-jest",
			{
				tsconfig: "./test/tsconfig.test.json"
			}
		],
	},
	coverageThreshold: {
		global: {
			statements: 5,
			branches: 5,
			functions: 5,
			lines: 5,
		},
	},
};
export default config;