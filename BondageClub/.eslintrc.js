"use strict";
module.exports = {
	extends: ["eslint:recommended", "plugin:compat/recommended"],
	env: {
		browser: true,
		es6: true,
	},
	parserOptions: {
		ecmaVersion: 2021,
	},
	root: true,
	plugins: [
		'sort-keys-custom',
		'compat'
	],
	ignorePatterns: [
		"Scripts/lib/**/*.js",
		"*.min.js",
		"Screens/MiniGame/KinkyDungeon/*.js"
	],
	settings: {
		polyfills: [
			// Notification is not supported in iOS Safari 14.5-14.8
			"Notification",
		],
	},
	rules: {
		"dot-notation": "error",
		"no-unused-expressions": "error",
		"no-caller": "error",
		"no-eval": "error",
		"no-new-wrappers": "error",
		"no-throw-literal": "error",
		"no-shadow": ["warn", { "hoist": "all" }],
		"strict": ["error", "global"],
		"no-constant-condition": ["error", { "checkLoops": false }],
		"no-unused-vars": ["warn", { "vars": "local", "args": "none", "varsIgnorePattern": "^_" }],
		"no-trailing-spaces": "warn",
		"semi": "warn",
		"indent": ["warn", "tab", { "SwitchCase": 1, "ignoredNodes": ["ConditionalExpression"] }],
		"unicode-bom": ["error", "never"],
		"eol-last": "error",
		"no-tabs": ["warn", { "allowIndentationTabs": true }],
		"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
		// Until globals are properly documented
		"no-undef": "off",
		"no-var": "off"
	},
};
