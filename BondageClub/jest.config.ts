/** @jest-config-loader ts-node */

import { defineConfig } from "jest";

export default defineConfig({
	verbose: true,
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["./Tests/setup.ts", "jest-expect-message"],
});
