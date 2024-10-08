import style from "@isentinel/eslint-config";

export default style({
	rules: {
		"@typescript-eslint/no-empty-interface": ["error", { allowInterfaces: true }],
		"import/no-namespace": "off",
		"max-lines": "error",
		"max-lines-per-function": "off",
		"no-param-reassign": "off",
		"sonar/cognitive-complexity": "off",
		"ts/no-non-null-assertion": "off",
	},
	typescript: {
		parserOptions: {
			project: "tsconfig.eslint.json",
		},
		tsconfigPath: "tsconfig.eslint.json",
	},
});
