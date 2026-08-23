"use strict";

import { defineConfig, globalIgnores } from "eslint/config";

import globals from "globals";
import sortKeysCustom from "eslint-plugin-sort-keys-custom";
import nounsanitized from "eslint-plugin-no-unsanitized";
import js from "@eslint/js";

import { FlatCompat } from "@eslint/eslintrc";

import tseslint from "typescript-eslint";
import path from "path";

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

/** Matches tsconfig.json "include". */
const typedFiles = [
	"Scripts/**/*",
	"Screens/**/*",
	"Assets/**/*",
	"Backgrounds/**/*.js",
];

const sharedPlugins = {
	"sort-keys-custom": sortKeysCustom,
	nounsanitized,
};

const sharedSettings = {
	polyfills: ["Notification"],
};

/** Safe on any @typescript-eslint/parser file (no type checker required). */
const customRules = {
	"dot-notation": "error",
	"no-unused-expressions": "error",
	"no-caller": "error",
	"no-eval": "error",
	"no-new-wrappers": "error",

	"no-shadow": "off",
	"@typescript-eslint/no-shadow": ["warn", {
		hoist: "all",
	}],

	"strict": ["error", "global"],

	"no-constant-condition": ["error", {
		checkLoops: false,
	}],

	"no-unused-vars": "off",
	"@typescript-eslint/no-unused-vars": ["warn", {
		vars: "local",
		args: "none",
		varsIgnorePattern: "^_",
		argsIgnorePattern: "^_",
		caughtErrorsIgnorePattern: "^_",
	}],
	
	// This set can go once we're TS-strict
	"@typescript-eslint/no-explicit-any": "off",
	"@typescript-eslint/no-empty-object-type": "off",
	"@typescript-eslint/no-unsafe-argument": "off",
	"@typescript-eslint/no-unsafe-assignment": "off",
	"@typescript-eslint/no-unsafe-call": "off",
	"@typescript-eslint/no-unsafe-return": "off",
	"@typescript-eslint/no-unsafe-member-access": "off",
	"@typescript-eslint/ban-ts-comment": "off",

	"@typescript-eslint/no-this-alias": "off",
	"@typescript-eslint/unbound-method": "off",
	"@typescript-eslint/require-await": "off",

	"no-trailing-spaces": "warn",
	semi: "warn",

	indent: ["warn", "tab", {
		SwitchCase: 1,
		ignoredNodes: ["ConditionalExpression"],
	}],

	"unicode-bom": ["error", "never"],
	"eol-last": "error",

	// Cannot be disabled in _just_ comments and docstrings, thus producing false positives
	"no-tabs": "off",

	"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],

	// Until globals are properly documented
	"no-undef": "off",
	"no-var": "off",

	"nounsanitized/property": "error",
	"nounsanitized/method": "error",
};

/** Rules that need `parserOptions.projectService` — only use on `typedFiles`. */
const typedOnlyRules = {
	"@typescript-eslint/restrict-template-expressions": ["error", { allowArray: true }],

	"@typescript-eslint/no-floating-promises": ["error", {
		"allowForKnownSafePromises": [
			{ "from": "file", "name": "SafePromise" },
		],
	}],
};

export default defineConfig([
	js.configs.recommended,
	globalIgnores([
		"eslint.config.mjs",
		"Scripts/lib/**/*.js",
		"**/*.min.js",
		"Screens/MiniGame/KinkyDungeon/*.js",
		"Tools/Node/csvtypescript_tmp_output/**/*.js",
	]),
	{
		files: typedFiles,

		extends: [
			...compat.extends("plugin:compat/recommended"),
			...tseslint.configs.recommendedTypeChecked,
		],

		plugins: sharedPlugins,
		settings: sharedSettings,

		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},

		rules: {
			...customRules,
			...typedOnlyRules,
		},
	},
	{
		files: ["Tests/**/*.js"],

		extends: [
			...compat.extends("plugin:compat/recommended"),
			...tseslint.configs.recommendedTypeChecked,
		],

		plugins: sharedPlugins,

		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: path.join(__dirname, "Tests"),
			},
		},

		rules: {
			...customRules,
			"@typescript-eslint/no-require-imports": "off",
			...typedOnlyRules,
		},
	},
	{
		files: ["**/*.d.ts"],
		rules: {
			// .d.ts are ambient declarations; 'use strict' does not apply.
			strict: "off",
		},
	},
	{
		ignores: ["Tools/Node/**/*.js"],

		languageOptions: {
			globals: {
				...globals.browser,
			},

			ecmaVersion: 2022,
			sourceType: "script",
		},
	},
	{
		files: ["Tools/Node/**/*.js"],

		extends: [
			...compat.extends("plugin:compat/recommended"),
			...tseslint.configs.recommended,
		],

		plugins: sharedPlugins,
		settings: sharedSettings,

		languageOptions: {
			globals: {
				...globals.browser,
			},

			ecmaVersion: 2022,
			sourceType: "module",
		},

		rules: customRules,
	},
]);
